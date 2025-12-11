import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { AddStockDialog } from "@/components/AddStockDialog";
import { getPortfolioSnapshot } from "@/app/actions"; // הפונקציה היעילה (Batch)
import { LiveDashboard } from "@/components/LiveDashboard"; // המנהל החדש

export default async function Home() {
  // --- לוגיקת משתמש (נשאר בדיוק אותו דבר) ---
  const users = await db.user.findMany({ include: { stocks: true } });

  if (users.length === 0) {
    await db.user.create({
      data: {
        email: "demo@findash.com",
        name: "משתמש ראשון",
        stocks: { create: { symbol: "AAPL", name: "Apple Inc." } }
      }
    });
  }

  // --- הבאת נתונים ---
  // במקום לחשב ידנית כאן, אנחנו קוראים לפונקציה שמביאה את הכל מוכן
  const initialData = await getPortfolioSnapshot();

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-slate-950 text-white p-8">
      
      {/* כותרת ראשית (לא נגענו) */}
      <div className="text-center mt-8 space-y-2">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Smart FinDash 🚀
        </h1>
        <p className="text-slate-400 text-lg">
            ניהול תיק השקעות חכם בזמן אמת
        </p>
      </div>

      {/* --- השינוי הגדול: המנהל החכם --- */}
      {/* הרכיב הזה מכיל בתוכו את הסיכום, את הסטטוס ואת רשימת המניות */}
      {/* הוא זה שידאג לרענן את הכל בבקשה אחת כל 30 שניות */}
      <LiveDashboard initialData={initialData} />
      
      {/* כפתורים תחתונים (לא נגענו) */}
      <div className="flex gap-4 mt-4 mb-12">
        <AddStockDialog />
        <Button variant="outline" className="text-black bg-white hover:bg-slate-200 border-none text-lg px-8 py-6">
          תיעוד API
        </Button>
      </div>

    </div>
  );
}