import YahooFinance from 'yahoo-finance2';
import { unstable_cache } from 'next/cache'; // 1. הייבוא של הקאש

const yahooFinance = new YahooFinance();

// --- פונקציה פנימית שעושה את העבודה השחורה מול יאהו ---
// אנחנו לא מייצאים אותה החוצה, אלא נעטוף אותה בקאש מיד
async function fetchStockDataInternal(symbol: string) {
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

// --- הגרסה המוגנת עם Cache (זמן חיים: 30 שניות) ---
// כל פעם שמישהו יקרא לפונקציה הזו, נקסט יבדוק: "האם כבר הבאתי את המניה הזו ב-30 שניות האחרונות?"
export const getStockData = unstable_cache(
  async (symbol: string) => fetchStockDataInternal(symbol),
  ['stock-data'], // מפתח ייחודי לקאש
  { revalidate: 30 } // תוקף הקאש: 30 שניות
);


// --- אותו דבר עבור ה-Batch (בקשה מרוכזת) ---
async function fetchBatchInternal(symbols: string[]) {
  if (!symbols || symbols.length === 0) return [];
  try {
    const quotes = await yahooFinance.quote(symbols);
    return quotes.map(quote => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      name: quote.shortName || quote.symbol,
    }));
  } catch (error) {
    console.error("Batch fetch failed", error);
    return [];
  }
}

// עוטפים גם את ה-Batch בקאש
export const getBatchStockData = unstable_cache(
  async (symbols: string[]) => fetchBatchInternal(symbols),
  ['batch-stock-data'],
  { revalidate: 30 }
);


// --- היסטוריה לגרף (שומרים ל-60 שניות כי זה פחות משתנה) ---
export const getStockHistory = unstable_cache(
  async (symbol: string) => {
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setMonth(today.getMonth() - 6); 

      const result = await yahooFinance.chart(symbol, {
        period1: startDate,
        interval: '1d',
      });

      if (!result || !result.quotes) return [];

      return result.quotes.map((day) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: day.close,
      }));
    } catch (error) {
      console.error(`Failed to fetch history for ${symbol}`, error);
      return [];
    }
  },
  ['stock-history'],
  { revalidate: 60 } // היסטוריה מתעדכנת פחות, אפשר לשמור לדקה
);