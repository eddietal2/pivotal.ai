import signalEducationCards from '@/components/ui/signalEducationData';

describe('signalEducationData', () => {
  test('includes MACD Bullish and Bearish entries', () => {
    const titles = signalEducationCards.map((c) => c.title);
    expect(titles).toContain('MACD Crossover (Bullish)');
    expect(titles).toContain('MACD Crossover (Bearish)');
  });
});
