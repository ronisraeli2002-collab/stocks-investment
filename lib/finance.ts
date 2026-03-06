import { redis } from "./redis";

// data interfaces
export interface StockQuote {
  price: number;
  change: number;
  name: string;
  symbol?: string;
}

export interface StockHistoryPoint {
  date: string;
  price: number;
}

export interface StockNewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
}

// Finnhub configuration
const FINNHUB_BASE = "https://finnhub.io/api/v1";
if (!process.env.FINNHUB_API_KEY) {
  console.warn("⚠️ WARNING: FINNHUB_API_KEY not set in environment");
}

const CACHE_TTL_REALTIME = 45;   // מחירים: 45 שניות (שיווק עדכני אבל הוגן)
const CACHE_TTL_HISTORY = 7200;  // גרף: 2 שעות (לא קורה כתמיד משתנה)

// Deduplication: מנע בקשות מרובות בו-זמנית לאותה מניה
const inflightRequests = new Map<string, Promise<StockQuote>>();

// ==========================================
// מתג שליטה: סביבת פיתוח (Mock) מול ייצור (Live)
// רק אם הגדרת USE_MOCK_DATA=true ב-.env תשתמש במoק
// אם אין FINNHUB_API_KEY, תשתמש גם במoק כברירת מחדל
// ==========================================
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true" || !process.env.FINNHUB_API_KEY; 

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
export async function getStockData(symbol: string): Promise<StockQuote> {
  if (USE_MOCK_DATA) {
    console.log(`📈 Using MOCK data for ${symbol}`);
    return getMockQuote(symbol);
  }

  const cacheKey = `stock:${symbol.toUpperCase()}`;
  
  // בדיקת Deduplication: אם כבר יש בקשה בעבודה, חכה לה
  if (inflightRequests.has(symbol)) {
    console.log(`⏳ Waiting for in-flight request for ${symbol}...`);
    return inflightRequests.get(symbol)!;
  }

  try {
    const cachedData = await redis.get(cacheKey) as StockQuote;
    if (cachedData) {
      console.log(`💾 Returning cached data for ${symbol}`);
      return cachedData;
    }

    console.log(`🔍 Fetching live data for ${symbol} from Finnhub...`);

    // יצור Promise וחזקה ב-map
    const fetchPromise = (async () => {
      const resp = await fetch(
        `${FINNHUB_BASE}/quote?symbol=${symbol.toUpperCase()}&token=${process.env.FINNHUB_API_KEY}`
      );
      const json = await resp.json();

      if (!json.c) {
        console.warn(`⚠️ No price data from Finnhub for ${symbol}:`, json);
      }

      const data = {
        price: json.c || 0,
        change: json.dp || 0,
        name: symbol.toUpperCase(),
      };

      console.log(`✅ Got ${symbol}: $${data.price}, ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%`);

      if (data.price > 0) {
        await redis.set(cacheKey, data, { ex: CACHE_TTL_REALTIME });
      }
      return data;
    })();

    inflightRequests.set(symbol, fetchPromise);
    
    const result = await fetchPromise;
    inflightRequests.delete(symbol);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${symbol}:`, error);
    inflightRequests.delete(symbol);
    return { price: 0, change: 0, name: symbol };
  }
}

// --- פונקציה: הבאת נתונים לקבוצת מניות ---
export async function getBatchStockData(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols || symbols.length === 0) return [];
  
  if (USE_MOCK_DATA) {
    return symbols.map(symbol => getMockQuote(symbol));
  }

  const promises = symbols.map(async (symbol) => {
    const cacheKey = `stock:${symbol.toUpperCase()}`;
    try {
      const cachedData = await redis.get(cacheKey) as StockQuote;
      if (cachedData) return { symbol: symbol.toUpperCase(), ...cachedData };

      const resp = await fetch(
        `${FINNHUB_BASE}/quote?symbol=${symbol.toUpperCase()}&token=${process.env.FINNHUB_API_KEY}`
      );
      const json = await resp.json();
      const data = {
        symbol: symbol.toUpperCase(),
        price: json.c || 0,
        change: json.dp || 0,
        name: symbol.toUpperCase(),
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

// --- פונקציה: חדשות למניה ---
export async function getStockNews(symbol: string): Promise<StockNewsItem[]> {
  if (USE_MOCK_DATA) {
    // fallback to static mock news
    return [
      {
        uuid: "mock-1",
        title: `דיווח מיוחד: אנליסטים מעלים את תחזית הצמיחה של ${symbol} לרבעון הקרוב`,
        publisher: "FinDash News",
        link: "#",
        providerPublishTime: Math.floor(Date.now() / 1000) - 3600
      },
      {
        uuid: "mock-2",
        title: `המניה של ${symbol} מציגה תנודתיות על רקע הכרזות חדשות בשוק הטכנולוגיה`,
        publisher: "FinDash Market Watch",
        link: "#",
        providerPublishTime: Math.floor(Date.now() / 1000) - 86400
      },
      {
        uuid: "mock-3",
        title: `האם זה הזמן הנכון להגדיל החזקות ב-${symbol}? ניתוח מעמיק`,
        publisher: "FinDash Analyst",
        link: "#",
        providerPublishTime: Math.floor(Date.now() / 1000) - 172800
      }
    ];
  }

  // real news via Finnhub
  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 30);
    
    console.log(`📰 Fetching news for ${symbol} from ${fromDate.toISOString().slice(0,10)} to ${toDate.toISOString().slice(0,10)}`);
    
    const resp = await fetch(
      `${FINNHUB_BASE}/company-news?symbol=${symbol.toUpperCase()}&from=${fromDate.toISOString().slice(0,10)}&to=${toDate.toISOString().slice(0,10)}&token=${process.env.FINNHUB_API_KEY}`
    );
    
    if (!resp.ok) {
      console.warn(`⚠️ Finnhub news returned ${resp.status} for ${symbol}, falling back to mock`);
      // Fallback to mock if permission denied
      return [
        {
          uuid: "mock-1",
          title: `דיווח מיוחד: אנליסטים מעלים את תחזית הצמיחה של ${symbol} לרבעון הקרוב`,
          publisher: "FinDash News",
          link: "#",
          providerPublishTime: Math.floor(Date.now() / 1000) - 3600
        },
        {
          uuid: "mock-2",
          title: `המניה של ${symbol} מציגה תנודתיות על רקע הכרזות חדשות בשוק הטכנולוגיה`,
          publisher: "FinDash Market Watch",
          link: "#",
          providerPublishTime: Math.floor(Date.now() / 1000) - 86400
        }
      ];
    }
    
    const json = await resp.json();
    
    if (!Array.isArray(json)) {
      console.warn(`⚠️ News response for ${symbol} is not an array:`, json);
      return [];
    }
    
    console.log(`✅ Got ${json.length} news items for ${symbol}`);
    
    return json.map((item: any) => ({
      uuid: item.id || item.url,
      title: item.headline,
      publisher: item.source,
      link: item.url,
      providerPublishTime: item.datetime
    }));
  } catch (err) {
    console.error("❌ News fetch error", err);
    return [];
  }
}

// --- פונקציה: היסטוריה לגרף ---
export async function getStockHistory(symbol: string): Promise<StockHistoryPoint[]> {
  if (USE_MOCK_DATA) {
    console.log(`📈 Using MOCK history for ${symbol}`);
    return getMockHistory(symbol);
  }

  const cacheKey = `history:${symbol.toUpperCase()}`;
  try {
    const cachedData = await redis.get(cacheKey) as StockHistoryPoint[];
    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
      console.log(`📊 Returning cached history for ${symbol}, points: ${cachedData.length}`);
      return cachedData;
    }

    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 60 * 24 * 365; // 1 year back
    
    console.log(`🔍 Fetching history for ${symbol} from Finnhub...`);
    console.log(`   Timestamp range: ${from} (${new Date(from * 1000).toISOString()}) to ${now} (${new Date(now * 1000).toISOString()})`);
    
    const resp = await fetch(
      `${FINNHUB_BASE}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=D&from=${from}&to=${now}&token=${process.env.FINNHUB_API_KEY}`
    );
    
    if (!resp.ok) {
      console.error(`❌ Finnhub HTTP error ${resp.status} for ${symbol}`);
      console.log(`📡 Raw response:`, await resp.text());
      // Fallback to mock on error
      return getMockHistory(symbol);
    }

    const json = await resp.json();
    
    console.log(`📡 Finnhub response for ${symbol}:`, JSON.stringify(json).substring(0, 200));
    
    if (json.s !== "ok" || !json.c || !json.t || json.c.length === 0) {
      console.warn(`⚠️ No history data from Finnhub for ${symbol}, status: ${json.s}`);
      console.log(`   Full response:`, JSON.stringify(json));
      // Fallback to mock when no data
      return getMockHistory(symbol);
    }

    const data = json.t.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      price: json.c[i],
    }));

    console.log(`✅ Got ${data.length} data points for ${symbol}`);
    
    if (data.length > 0) {
      await redis.set(cacheKey, data, { ex: CACHE_TTL_HISTORY });
    }
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch history for ${symbol}:`, error);
    // Fallback to mock on exception
    return getMockHistory(symbol);
  }
}