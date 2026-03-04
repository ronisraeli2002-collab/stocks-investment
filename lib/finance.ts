import YahooFinance from "yahoo-finance2";
import { redis } from "./redis";

const CACHE_TTL_REALTIME = 60;   
const CACHE_TTL_HISTORY = 3600;  
const yahooConfig = { suppressNotices: ['yahooSurvey'] };

// ==========================================
// מתג שליטה: סביבת פיתוח (Mock) מול ייצור (Live)
// שנה ל-false כדי לחזור למשוך נתונים אמיתיים מיאהו
// ==========================================
const USE_MOCK_DATA = true; 

// --- נתוני דמה (Mock Data) לדילוג על יאהו ---
const MOCK_PRICES: Record<string, { price: number, name: string }> = {
  AAPL: { price: 175.50, name: "Apple Inc." },
  MSFT: { price: 415.20, name: "Microsoft Corp." },
  TSLA: { price: 202.10, name: "Tesla Inc." },
  META: { price: 485.30, name: "Meta Platforms" },
  AMZN: { price: 178.15, name: "Amazon.com" },
  NVDA: { price: 850.40, name: "NVIDIA Corp." },
  GOOG: { price: 145.20, name: "Alphabet Inc." },
  UBER: { price: 78.50, name: "Uber Technologies" },
  SPY: { price: 510.10, name: "SPDR S&P 500 ETF" },
};

function getMockQuote(symbol: string) {
  const data = MOCK_PRICES[symbol.toUpperCase()] || { price: 100, name: symbol };
  // מייצר שינוי אקראי קל באחוזים כדי שהדשבורד ייראה חי (ירוק/אדום)
  const randomChange = (Math.random() * 4) - 2; 
  return {
    symbol: symbol.toUpperCase(),
    price: data.price,
    change: randomChange,
    name: data.name,
  };
}

function getMockHistory(symbol: string) {
  const data = [];
  let currentPrice = MOCK_PRICES[symbol.toUpperCase()]?.price || 100;
  currentPrice = currentPrice * 0.8; // נתחיל את הגרף 20% למטה כדי להראות צמיחה
  
  // מייצר 30 ימי היסטוריה פיקטיביים אחורה
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    currentPrice = currentPrice + (Math.random() * 10 - 4); // תנודתיות אקראית
    data.push({
      date: d.toISOString(),
      price: currentPrice
    });
  }
  return data;
}
// ==========================================

// --- פונקציה: הבאת נתונים למניה בודדת ---
export async function getStockData(symbol: string) {
  if (USE_MOCK_DATA) return getMockQuote(symbol);

  const cacheKey = `stock:${symbol.toUpperCase()}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) return cachedData;

    const yahooFinance = new YahooFinance(yahooConfig);
    const quote = await yahooFinance.quote(symbol);
    
    const data = {
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      name: quote.shortName || quote.longName || symbol,
    };

    if (data.price > 0) {
      await redis.set(cacheKey, data, { ex: CACHE_TTL_REALTIME });
    }
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${symbol}:`, error);
    return { price: 0, change: 0, name: symbol };
  }
}

// --- פונקציה: הבאת נתונים לקבוצת מניות ---
export async function getBatchStockData(symbols: string[]) {
  if (!symbols || symbols.length === 0) return [];
  
  if (USE_MOCK_DATA) {
    return symbols.map(symbol => getMockQuote(symbol));
  }

  const promises = symbols.map(async (symbol) => {
    const cacheKey = `stock:${symbol.toUpperCase()}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) return { symbol, ...(cachedData as any) }; 

      const yahooFinance = new YahooFinance(yahooConfig);
      const quote = await yahooFinance.quote(symbol);
      
      const data = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChangePercent || 0,
        name: quote.shortName || quote.longName || quote.symbol,
      };

      if (data.price > 0) {
        await redis.set(cacheKey, data, { ex: CACHE_TTL_REALTIME });
      }
      return data;
    } catch (e) {
      console.warn(`⚠️ Fetch failed for ${symbol}`);
      return null; 
    }
  });

  const results = await Promise.all(promises);
  return results.filter((res) => res !== null);
}

// --- פונקציה: היסטוריה לגרף ---
export async function getStockHistory(symbol: string) {
  if (USE_MOCK_DATA) return getMockHistory(symbol);

  const cacheKey = `history:${symbol.toUpperCase()}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) return cachedData;

    const yahooFinance = new YahooFinance(yahooConfig);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); 

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      interval: "1d",
    });

    if (!result || !result.quotes) return [];

    const data = result.quotes
      .filter((day: any) => day.date && day.close)
      .map((day: any) => ({
        date: new Date(day.date).toISOString(), 
        price: day.close,
      }));

    if (data.length > 0) {
      await redis.set(cacheKey, data, { ex: CACHE_TTL_HISTORY });
    }
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch history for ${symbol}:`, error);
    return [];
  }
}