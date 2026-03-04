"use server";

import  YahooFinance  from "yahoo-finance2"; 
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStockData, getStockHistory, getBatchStockData } from "@/lib/finance";
import { analyzeStockWithPython } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";

// --- פונקציה 1: הוספת מניה ---
export async function addStock(symbolInput: string, quantityInput: number = 1) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, message: "יש להתחבר למערכת כדי להוסיף מניות" };
  }

  const symbol = symbolInput?.toUpperCase().trim();
  const quantity = Number(quantityInput) || 1;

  if (!symbol) return { success: false, message: "נא להזין סימול מניה" };
  if (quantity < 1) return { success: false, message: "כמות חייבת להיות לפחות 1" };

  try {
    const existingStock = await db.stock.findFirst({
      where: {
        userId: userId,
        symbol: symbol,
      },
    });

    if (existingStock) {
      return { success: false, message: `⚠️ המניה ${symbol} כבר קיימת בתיק שלך!` };
    }

    const liveData = await getStockData(symbol);
    
    if (!liveData || liveData.price === 0) {
      return { success: false, message: `❌ המניה ${symbol} לא נמצאה בבורסה` };
    }

    await db.stock.create({
      data: {
        symbol: symbol,
        name: liveData.name || symbol,
        quantity: quantity,
        userId: userId,
      },
    });

    revalidatePath("/");
    return { success: true };

  } catch (error) {
    console.error("Error adding stock:", error);
    return { success: false, message: "שגיאה כללית בשמירת המניה" };
  }
}

// --- פונקציה 2: קבלת מחיר עדכני ---
export async function getLatestPrice(symbol: string) {
  return await getStockData(symbol);
}

// --- פונקציה 3: מחיקת מניה ---
export async function removeStock(id: number) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "לא מחובר" };

  try {
    if (!id) return { success: false, message: "מזהה מניה חסר" };
    
    await db.stock.deleteMany({ 
      where: { 
        id: id,
        userId: userId 
      } 
    });
    
    revalidatePath("/");
    return { success: true, message: "המניה נמחקה מהתיק" };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, message: "שגיאה במחיקת המניה" };
  }
}

// --- פונקציה 4: קבלת היסטוריה ---
export async function getHistory(symbol: string) {
  return await getStockHistory(symbol);
}

// --- פונקציה 5: תמונת מצב לתיק ---
export async function getPortfolioSnapshot() {
  const { userId } = await auth();
  
  if (!userId) return [];

  const userStocks = await db.stock.findMany({
    where: { userId: userId },
    orderBy: { addedAt: 'desc' }
  });

  if (userStocks.length === 0) return [];

  const symbols = userStocks.map(stock => stock.symbol);
  const marketData = await getBatchStockData(symbols);

  const snapshot = userStocks.map(stock => {
    const data = marketData.find(m => m.symbol === stock.symbol) || { price: 0, change: 0, name: stock.symbol };
    
    return {
      id: stock.id,
      symbol: stock.symbol,
      name: data.name || stock.name || stock.symbol,
      price: data.price,
      change: data.change,
      quantity: stock.quantity,
      value: stock.quantity * data.price
    };
  });

  return snapshot;
}

// --- פונקציה 6: ניתוח חכם ---
export async function getAiAnalysis(symbol: string) {
  return await analyzeStockWithPython(symbol);
}

// --- פונקציה 7: קבלת חדשות למניה (מנותק מיאהו בסביבת פיתוח) ---
export async function getStockNews(symbol: string) {
  // אנחנו מחזירים את נתוני הגיבוי באופן מיידי כדי לחסל את קריסות ה-fetch של Next.js
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