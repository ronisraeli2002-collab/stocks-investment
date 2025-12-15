import YahooFinance from 'yahoo-finance2'; // 1. ייבוא המחלקה
import { redis } from './redis'; // הייבוא של הלקוח שיצרנו

// 2. יצירת המופע (התיקון הקריטי)
const yahooFinance = new YahooFinance();

// קבועי זמן (בשניות)
const CACHE_TTL_REALTIME = 30; // 30 שניות למחיר מניה
const CACHE_TTL_HISTORY = 300; // 5 דקות להיסטוריה

// --- פונקציה: הבאת נתונים למניה בודדת ---
export async function getStockData(symbol: string) {
  const cacheKey = `stock:${symbol.toUpperCase()}`;

  try {
    // 1. בדיקה ב-Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // console.log(`⚡ Cache HIT for ${symbol}`); // אפשר להוריד את ההערה כדי לראות בלוגים
      return JSON.parse(cachedData);
    }

    // 2. אם אין בקאש - פונים ליאהו
    const quote = await yahooFinance.quote(symbol);
    
    const data = {
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      name: quote.shortName || symbol,
    };

    // 3. שמירה ב-Redis
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL_REALTIME);

    return data;

  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}`, error);
    return { price: 0, change: 0, name: symbol };
  }
}

// --- פונקציה: הבאת נתונים לקבוצת מניות (Batch) ---
export async function getBatchStockData(symbols: string[]) {
  if (!symbols || symbols.length === 0) return [];
  
  const sortedSymbols = [...symbols].sort().join(',');
  const cacheKey = `batch:${sortedSymbols}`;

  try {
    // 1. בדיקה ב-Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ Cache HIT for Batch`);
      return JSON.parse(cachedData);
    }

    // 2. פניה ליאהו
    const quotes = await yahooFinance.quote(symbols);
    const data = quotes.map((quote: any) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      name: quote.shortName || quote.symbol,
    }));

    // 3. שמירה
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL_REALTIME);

    return data;

  } catch (error) {
    console.error("Batch fetch failed", error);
    return [];
  }
}

// --- פונקציה: היסטוריה לגרף ---
export async function getStockHistory(symbol: string) {
  const cacheKey = `history:${symbol.toUpperCase()}`;

  try {
    // 1. בדיקה ב-Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 2. פניה ליאהו
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 6); 

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      interval: '1d',
    });

    if (!result || !result.quotes) return [];

    const data = result.quotes.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: day.close,
    }));

    // 3. שמירה
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL_HISTORY);

    return data;

  } catch (error) {
    console.error(`Failed to fetch history for ${symbol}`, error);
    return [];
  }
}