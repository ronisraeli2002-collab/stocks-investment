import YahooFinance from 'yahoo-finance2'; // ייבוא המחלקה (שים לב ל-Y גדולה)

// יצירת המופע (הפעולה שהייתה חסרה)
const yahooFinance = new YahooFinance();

export async function getStockData(symbol: string) {
  try {
    // שימוש במופע שיצרנו
    const quote = await yahooFinance.quote(symbol);
    
    return {
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      name: quote.shortName || symbol,
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}`, error);
    return { price: 0, change: 0, name: symbol };
  }
}