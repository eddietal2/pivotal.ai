import logging

from .news_service import YahooFinanceNewsService

logger = logging.getLogger(__name__)

# Major indices to monitor
INDEX_SYMBOLS = {
    '^GSPC': 'S&P 500',
    '^DJI': 'Dow Jones',
    '^IXIC': 'Nasdaq Composite',
}

INDEX_MOVE_THRESHOLD = 1.5  # percent — triggers a global intraday alert


class PriceMonitorService:
    """
    Monitors price movements for indices and watchlist symbols.
    Uses YahooFinanceNewsService.get_price_change() internally so all
    yfinance calls go through a single, consistent code path.
    """

    def __init__(self):
        self._news_service = YahooFinanceNewsService()

    def check_index_moves(self) -> list:
        """
        Check S&P 500, Dow Jones, and Nasdaq for moves exceeding
        INDEX_MOVE_THRESHOLD (1.5%) from today's open.

        Returns a list of dicts for every index that has crossed the threshold:
            {symbol, name, current_price, open_price, change_abs,
             change_pct, direction, threshold}

        Returns an empty list if the market is closed or data is unavailable.
        """
        triggered = []

        for symbol, name in INDEX_SYMBOLS.items():
            result = self._news_service.get_price_change(symbol)
            if result is None:
                continue

            if abs(result['change_pct']) >= INDEX_MOVE_THRESHOLD:
                triggered.append({
                    **result,
                    'name': name,
                    'threshold': INDEX_MOVE_THRESHOLD,
                })
                logger.info(
                    "Index move alert: %s (%s) %.2f%%",
                    name, symbol, result['change_pct']
                )

        return triggered

    def check_watchlist_moves(self, symbols: list, threshold: float = 3.0) -> list:
        """
        Check a list of ticker symbols for moves exceeding `threshold` percent
        from today's open.

        Args:
            symbols:   List of ticker strings, e.g. ['AAPL', 'TSLA']
            threshold: Percent move required to trigger an alert (default 3.0%)

        Returns a list of dicts for every symbol that has crossed the threshold:
            {symbol, current_price, open_price, change_abs,
             change_pct, direction, threshold}
        """
        if not symbols:
            return []

        triggered = []

        for symbol in symbols:
            result = self._news_service.get_price_change(symbol)
            if result is None:
                continue

            if abs(result['change_pct']) >= threshold:
                triggered.append({
                    **result,
                    'threshold': threshold,
                })
                logger.info(
                    "Watchlist move alert: %s %.2f%% (threshold %.1f%%)",
                    symbol, result['change_pct'], threshold
                )

        return triggered
