"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
// שים לב: אנחנו מייבאים עכשיו גם את getBatchStockData
import { getStockData, getStockHistory, getBatchStockData } from "@/lib/finance";

// --- פונקציה 1: הוספת מניה (עם בדיקות, כמות והודעות) ---
export async function addStock(formData: FormData) {
  const symbol = (formData.get("symbol") as string)?.toUpperCase().trim();
  const quantity = parseInt(formData.get("quantity") as string) || 1;

  if (!symbol) return { success: false, message: "נא להזין סימול מניה" };
  if (quantity < 1) return { success: false, message: "כמות חייבת להיות לפחות 1" };

  const user = await db.user.findFirst();
  if (!user) return { success: false, message: "משתמש לא נמצא" };

  // בדיקת כפילות
  const existingStock = await db.stock.findFirst({
    where: {
      userId: user.id,
      symbol: symbol,
    },
  });

  if (existingStock) {
    return { success: false, message: `⚠️ המניה ${symbol} כבר קיימת בתיק שלך!` };
  }

  // בדיקת תקינות מול יאהו
  const liveData = await getStockData(symbol);
  
  if (liveData.price === 0) {
    return { success: false, message: `❌ המניה ${symbol} לא נמצאה בבורסה` };
  }

  // שמירה
  await db.stock.create({
    data: {
      symbol: symbol,
      name: liveData.name,
      quantity: quantity,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return { success: true, message: `✅ נוספו ${quantity} מניות של ${symbol}!` };
}

// --- פונקציה 2: קבלת מחיר עדכני (בודד) ---
export async function getLatestPrice(symbol: string) {
  return await getStockData(symbol);
}

// --- פונקציה 3: מחיקת מניה ---
export async function removeStock(id: number) {
  try {
    await db.stock.delete({ where: { id } });
    revalidatePath("/");
    return { success: true, message: "המניה נמחקה מהתיק" };
  } catch (error) {
    return { success: false, message: "שגיאה במחיקת המניה" };
  }
}

// --- פונקציה 4: קבלת היסטוריה לגרף ---
export async function getHistory(symbol: string) {
  return await getStockHistory(symbol);
}

// --- פונקציה 5: קבלת תמונת מצב לכל התיק (Optimized Batch Request) ---
export async function getPortfolioSnapshot() {
  const user = await db.user.findFirst({
    include: { stocks: true }
  });

  if (!user || user.stocks.length === 0) return [];

  // 1. אוספים את כל הסימולים לרשימה אחת
  const symbols = user.stocks.map(stock => stock.symbol);

  // 2. שולחים בקשה אחת מרוכזת ליאהו (הרבה יותר מהיר!)
  const marketData = await getBatchStockData(symbols);

  // 3. מחברים את המידע
  const snapshot = user.stocks.map(stock => {
    const data = marketData.find(m => m.symbol === stock.symbol) || { price: 0, change: 0 };
    
    return {
      symbol: stock.symbol,
      price: data.price,
      change: data.change,
      quantity: stock.quantity
    };
  });

  return snapshot;
}