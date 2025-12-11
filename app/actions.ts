"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStockData, getStockHistory } from "@/lib/finance"; 

// --- פונקציה 1: הוספת מניה מעודכנת ---
export async function addStock(formData: FormData) {
  const symbol = (formData.get("symbol") as string)?.toUpperCase().trim();
  // קליטת הכמות מהטופס (אם לא הכניסו כלום, נניח שזה 1)
  const quantity = parseInt(formData.get("quantity") as string) || 1;

  if (!symbol) return { success: false, message: "נא להזין סימול מניה" };
  if (quantity < 1) return { success: false, message: "כמות חייבת להיות לפחות 1" };

  const user = await db.user.findFirst();
  if (!user) return { success: false, message: "משתמש לא נמצא" };

  const existingStock = await db.stock.findFirst({
    where: { userId: user.id, symbol: symbol },
  });

  if (existingStock) {
    return { success: false, message: `⚠️ המניה ${symbol} כבר קיימת בתיק שלך!` };
  }

  const liveData = await getStockData(symbol);
  
  if (liveData.price === 0) {
    return { success: false, message: `❌ המניה ${symbol} לא נמצאה בבורסה` };
  }

  await db.stock.create({
    data: {
      symbol: symbol,
      name: liveData.name,
      quantity: quantity, // שומרים את הכמות החדשה!
      userId: user.id,
    },
  });

  revalidatePath("/");
  return { success: true, message: `✅ נוספו ${quantity} מניות של ${symbol}!` };
}

// --- פונקציה 2: קבלת מחיר עדכני ---
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

// --- פונקציה 4 (החדשה!): קבלת היסטוריה לגרף ---
export async function getHistory(symbol: string) {
  return await getStockHistory(symbol);
}