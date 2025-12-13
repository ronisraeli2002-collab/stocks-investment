"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStockData, getStockHistory, getBatchStockData } from "@/lib/finance";
import { analyzeStockWithPython } from "@/lib/ai";

// --- פונקציה 1: הוספת מניה (תוקן: מקבל משתנים ישירות ולא FormData) ---
export async function addStock(symbolInput: string, quantityInput: number = 1) {
  // ניקוי הקלט
  const symbol = symbolInput?.toUpperCase().trim();
  const quantity = Number(quantityInput) || 1;

  if (!symbol) return { success: false, message: "נא להזין סימול מניה" };
  if (quantity < 1) return { success: false, message: "כמות חייבת להיות לפחות 1" };

  try {
    const user = await db.user.findFirst();
    // הערה: אם אין לך עדיין משתמשים ב-DB, זה יכשיל את הפעולה.
    // לצורך הפיתוח, אם אין משתמש, אפשר ליצור אחד זמני או להחזיר שגיאה.
    if (!user) return { success: false, message: "משתמש לא נמצא במערכת (האם הרצת seed?)" };

    // בדיקת כפילות
    const existingStock = await db.stock.findFirst({
      where: {
        userId: user.id,
        symbol: symbol,
      },
    });

    if (existingStock) {
      // אם המניה קיימת, אנחנו רק מעדכנים את הכמות (אופציונלי, או מחזירים שגיאה)
      return { success: false, message: `⚠️ המניה ${symbol} כבר קיימת בתיק שלך!` };
    }

    // בדיקת תקינות מול יאהו
    const liveData = await getStockData(symbol);
    
    // אם המחיר הוא 0 או אין שם, כנראה שהמניה לא קיימת
    if (!liveData || liveData.price === 0) {
      return { success: false, message: `❌ המניה ${symbol} לא נמצאה בבורסה` };
    }

    // שמירה בבסיס הנתונים
    await db.stock.create({
      data: {
        symbol: symbol,
        name: liveData.name || symbol, // שימוש בשם מיאהו
        quantity: quantity,
        userId: user.id,
        // מחיר ושינוי לא נשמרים ב-DB בדרך כלל כי הם משתנים כל רגע, 
        // אבל הם יגיעו מהשאילתה החיה
      },
    });

    revalidatePath("/");
    return { success: true }; // הדשבורד מצפה ל-success

  } catch (error) {
    console.error("Error adding stock:", error);
    return { success: false, message: "שגיאה כללית בשמירת המניה" };
  }
}

// --- פונקציה 2: קבלת מחיר עדכני (בודד) ---
export async function getLatestPrice(symbol: string) {
  return await getStockData(symbol);
}

// --- פונקציה 3: מחיקת מניה ---
export async function removeStock(id: number) {
  try {
    if (!id) return { success: false, message: "מזהה מניה חסר" };
    
    await db.stock.delete({ where: { id } });
    
    revalidatePath("/");
    return { success: true, message: "המניה נמחקה מהתיק" };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, message: "שגיאה במחיקת המניה" };
  }
}

// --- פונקציה 4: קבלת היסטוריה לגרף ---
export async function getHistory(symbol: string) {
  return await getStockHistory(symbol);
}

// --- פונקציה 5: קבלת תמונת מצב לכל התיק (Batch Request) ---
export async function getPortfolioSnapshot() {
  const user = await db.user.findFirst({
    include: { stocks: true }
  });

  if (!user || user.stocks.length === 0) return [];

  // 1. אוספים את כל הסימולים לרשימה אחת
  const symbols = user.stocks.map(stock => stock.symbol);

  // 2. שולחים בקשה אחת מרוכזת ליאהו
  const marketData = await getBatchStockData(symbols);

  // 3. מחברים את המידע
  const snapshot = user.stocks.map(stock => {
    // מציאת המידע העדכני מהרשימה שחזרה מיאהו
    const data = marketData.find(m => m.symbol === stock.symbol) || { price: 0, change: 0 };
    
    return {
      id: stock.id,          // *** חובה להחזיר ID כדי שהמחיקה תעבוד! ***
      symbol: stock.symbol,
      name: stock.name,      // *** חשוב להחזיר גם את השם ***
      price: data.price,
      change: data.change,
      quantity: stock.quantity,
    };
  });

  return snapshot;
}

// --- פונקציה 6: הפעלת הניתוח החכם ---
export async function getAiAnalysis(symbol: string) {
  return await analyzeStockWithPython(symbol);
}