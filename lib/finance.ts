import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getStockData(symbol: string) {
  try {
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

// --- השינוי הוא כאן ---
export async function getStockHistory(symbol: string) {
  try {
    const today = new Date();
    
    // חישוב תאריך התחלה: 6 חודשים אחורה
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 6); 

    const result = await yahooFinance.chart(symbol, {
      period1: startDate, // שולחים את התאריך של לפני חצי שנה
      interval: '1d',     // עדיין שומרים על מרווח של יום אחד (זה ייתן כ-180 נקודות, נראה מצוין בגרף)
    });

    if (!result || !result.quotes) return [];

    return result.quotes.map((day) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // שיניתי את הפורמט שיראה תאריך ולא יום בשבוע
      price: day.close,
    }));

  } catch (error) {
    console.error(`Failed to fetch history for ${symbol}`, error);
    return [];
  }
}