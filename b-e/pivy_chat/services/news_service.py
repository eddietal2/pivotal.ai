import logging
import sys
import time
from datetime import datetime, timezone, timedelta
from io import StringIO

logger = logging.getLogger(__name__)

# Suppress yfinance noise (matches pattern in financial_data/services.py)
logging.getLogger('yfinance').setLevel(logging.CRITICAL)
logging.getLogger('peewee').setLevel(logging.CRITICAL)


class YahooFinanceNewsService:
    """
    Fetches financial news and price data from Yahoo Finance via yfinance.
    yfinance is imported inside methods to avoid circular import / startup issues.
    """

    MARKET_TICKERS = ['SPY', 'QQQ', 'DIA']

    # Curated list of high-profile tickers checked for earnings today.
    EARNINGS_WATCHLIST = [
        'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO',
        'JPM', 'V', 'MA', 'UNH', 'XOM', 'WMT', 'JNJ', 'PG', 'HD',
        'BAC', 'MRK', 'ABBV', 'CVX', 'LLY', 'KO', 'PEP', 'AMD',
        'INTC', 'CSCO', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM',
        'GS', 'MS', 'C', 'WFC', 'BLK', 'AXP',
        'BA', 'CAT', 'GE', 'HON', 'RTX', 'LMT',
        'DIS', 'CMCSA', 'VZ', 'T', 'TMUS',
    ]

    # ------------------------------------------------------------------ #
    #  Internal helpers                                                    #
    # ------------------------------------------------------------------ #

    def _suppress_io(self):
        """Context: redirect stdout/stderr to suppress yfinance chatter."""
        return _SuppressIO()

    def _fetch_raw_news(self, symbol: str) -> list:
        """Return raw yfinance news list for a single ticker."""
        import yfinance as yf
        with self._suppress_io():
            try:
                return yf.Ticker(symbol).news or []
            except Exception as e:
                logger.warning("Failed to fetch news for %s: %s", symbol, e)
                return []

    def _normalize_item(self, item: dict, source_symbol: str) -> dict | None:
        """
        Convert a raw yfinance news dict into a clean, consistent dict.
        yfinance v0.2 nests metadata under item['content'].
        """
        try:
            content = item.get('content', {})

            title = content.get('title') or item.get('title', '')
            if not title:
                return None

            # Published timestamp — can be ISO string or Unix int
            raw_date = content.get('pubDate') or item.get('providerPublishTime')
            published_at = None
            if isinstance(raw_date, str) and raw_date:
                try:
                    published_at = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                except ValueError:
                    pass
            elif isinstance(raw_date, (int, float)):
                published_at = datetime.fromtimestamp(raw_date, tz=timezone.utc)

            # Related tickers
            tickers = []
            finance = content.get('finance', {})
            if finance:
                tickers = [s.get('symbol', '') for s in finance.get('stockTickers', []) if s.get('symbol')]
            if not tickers:
                tickers = item.get('relatedTickers', [source_symbol])

            # Publisher name
            provider = content.get('provider', {})
            publisher = provider.get('displayName') or item.get('publisher', 'Yahoo Finance')

            # Article link
            click_through = content.get('clickThroughUrl', {})
            link = (click_through.get('url') if isinstance(click_through, dict) else '') or item.get('link', '')

            return {
                'title': title,
                'publisher': publisher,
                'link': link,
                'published_at': published_at.isoformat() if published_at else None,
                'tickers': tickers,
                'source_symbol': source_symbol,
            }
        except Exception as e:
            logger.debug("Error normalizing news item: %s", e)
            return None

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

    def get_market_news(self, tickers: list = None, hours_back: int = 12) -> list:
        """
        Fetch recent news for broad market tickers (default: SPY, QQQ, DIA).
        Returns a deduplicated list of news dicts from the last `hours_back` hours,
        sorted newest-first.

        Each item: {title, publisher, link, published_at (ISO str), tickers, source_symbol}
        """
        if tickers is None:
            tickers = self.MARKET_TICKERS

        cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=hours_back)
        seen_titles: set = set()
        results: list = []

        for symbol in tickers:
            raw_items = self._fetch_raw_news(symbol)
            for item in raw_items:
                normalized = self._normalize_item(item, symbol)
                if not normalized:
                    continue

                title_key = normalized['title'].lower().strip()
                if title_key in seen_titles:
                    continue
                seen_titles.add(title_key)

                # Drop items older than cutoff
                if normalized['published_at']:
                    try:
                        pub_dt = datetime.fromisoformat(normalized['published_at'])
                        if pub_dt.tzinfo is None:
                            pub_dt = pub_dt.replace(tzinfo=timezone.utc)
                        if pub_dt < cutoff:
                            continue
                    except (ValueError, TypeError):
                        pass

                results.append(normalized)

            time.sleep(0.3)  # Polite delay between tickers

        # Sort newest first
        results.sort(key=lambda x: x['published_at'] or '', reverse=True)
        return results

    def get_watchlist_news(self, symbols: list) -> list:
        """
        Fetch recent news for a specific list of symbols (user's watchlist).
        Returns deduplicated news from the last 12 hours, sorted newest-first.
        """
        if not symbols:
            return []
        return self.get_market_news(tickers=symbols, hours_back=12)

    def get_earnings_today(self) -> list:
        """
        Check EARNINGS_WATCHLIST tickers for earnings scheduled today.
        Returns list of {symbol, company_name, earnings_date} dicts.
        """
        import yfinance as yf

        today = datetime.now(tz=timezone.utc).date()
        earnings_today: list = []

        for symbol in self.EARNINGS_WATCHLIST:
            with self._suppress_io():
                try:
                    ticker = yf.Ticker(symbol)
                    calendar = ticker.calendar
                    if calendar is None:
                        continue

                    # calendar shape varies by yfinance version
                    earnings_date = None
                    if isinstance(calendar, dict):
                        raw = calendar.get('Earnings Date')
                        if isinstance(raw, list) and raw:
                            earnings_date = raw[0]
                        else:
                            earnings_date = raw

                    if earnings_date is None:
                        continue

                    # Normalise to a plain date
                    if hasattr(earnings_date, 'date'):
                        earnings_date = earnings_date.date()
                    elif hasattr(earnings_date, 'to_pydatetime'):
                        earnings_date = earnings_date.to_pydatetime().date()

                    if earnings_date != today:
                        continue

                    try:
                        company_name = ticker.fast_info.display_name or symbol
                    except Exception:
                        company_name = symbol

                    earnings_today.append({
                        'symbol': symbol,
                        'company_name': company_name,
                        'earnings_date': str(earnings_date),
                    })

                except Exception as e:
                    logger.debug("Could not check earnings for %s: %s", symbol, e)

            time.sleep(0.1)

        return earnings_today

    def get_price_change(self, symbol: str) -> dict | None:
        """
        Get the current intraday price change for a symbol.
        Returns {symbol, current_price, open_price, change_abs, change_pct, direction}
        or None if data is unavailable.
        """
        import yfinance as yf

        with self._suppress_io():
            try:
                info = yf.Ticker(symbol).fast_info

                current = getattr(info, 'last_price', None)
                open_price = getattr(info, 'open', None)

                if current is None or open_price is None or open_price == 0:
                    return None

                change_abs = round(float(current) - float(open_price), 4)
                change_pct = round((change_abs / float(open_price)) * 100, 4)

                return {
                    'symbol': symbol,
                    'current_price': round(float(current), 4),
                    'open_price': round(float(open_price), 4),
                    'change_abs': change_abs,
                    'change_pct': change_pct,
                    'direction': 'up' if change_pct >= 0 else 'down',
                }
            except Exception as e:
                logger.warning("Failed to get price change for %s: %s", symbol, e)
                return None


# ------------------------------------------------------------------ #
#  Internal helper context manager                                     #
# ------------------------------------------------------------------ #

class _SuppressIO:
    """Temporarily redirects stdout/stderr to suppress yfinance console output."""

    def __enter__(self):
        self._old_stdout = sys.stdout
        self._old_stderr = sys.stderr
        sys.stdout = StringIO()
        sys.stderr = StringIO()
        return self

    def __exit__(self, *_):
        sys.stdout = self._old_stdout
        sys.stderr = self._old_stderr
