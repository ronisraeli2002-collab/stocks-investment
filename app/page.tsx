import { db } from "@/lib/db";
import { getPortfolioSnapshot } from "@/app/actions";
import { LiveDashboard } from "@/components/LiveDashboard";

// זה מבטיח שהדף תמיד יביא נתונים עדכניים ולא ישמור cache ישן
export const dynamic = "force-dynamic";

export default async function Home() {
  // --- לוגיקה קריטית: יצירת משתמש ראשוני אם לא קיים ---
  // (זה נשאר כדי שהפרויקט יעבוד גם על דאטה-בייס נקי)
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

  // --- הבאת הנתונים הראשוניים לדשבורד ---
  const initialData = await getPortfolioSnapshot();

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8" dir="rtl">
      
      {/* כותרת ראשית */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col items-center text-center mt-8 space-y-2">
        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Smart FinDash 🚀
        </h1>
        <p className="text-slate-400 text-lg">
            ניהול תיק השקעות חכם בזמן אמת
        </p>
      </div>

      {/* הדשבורד שמכיל הכל (סיכום, הוספה, רשימה) */}
      <LiveDashboard initialData={initialData} />
      
    </main>
  );
}