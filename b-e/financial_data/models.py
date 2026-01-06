from django.db import models

# Create your models here.

class StockData(models.Model):
    ticker = models.CharField(max_length=10, help_text="Stock ticker symbol (e.g., AAPL)")
    date = models.DateField(help_text="Date of the stock data")
    open_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Opening price")
    high_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Highest price")
    low_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Lowest price")
    close_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Closing price")
    volume = models.BigIntegerField(help_text="Trading volume")

    class Meta:
        unique_together = ('ticker', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.ticker} - {self.date} - Close: {self.close_price}"
