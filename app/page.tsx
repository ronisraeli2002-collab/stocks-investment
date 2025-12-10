import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { AddStockDialog } from "@/components/AddStockDialog"; // 1. הייבוא של הרכיב החדש

export default async function Home() {
  // --- חלק 1: הלוגיקה (Backend) ---
  
  // שליפת המשתמשים + המניות שלהם
  const users = await db.user.findMany({
    include: {
      stocks: true, 
    }
  });

  // יצירת משתמש ראשוני אם המערכת ריקה
  if (users.length === 0) {
    await db.user.create({
      data: {
        email: "demo@findash.com",
        name: "משתמש ראשון",
        stocks: {
          create: { symbol: "AAPL", name: "Apple Inc." }
        }
      }
    });
  }

  const currentUser = users[0];

  // --- חלק 2: העיצוב (Frontend) ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 text-white p-8">
      
      {/* --- כותרת וטקסט --- */}
      <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-center">
        Smart FinDash 🚀
      </h1>
      
      <p className="text-slate-400 text-xl text-center max-w-lg">
        פלטפורמת ניתוח מניות וקריפטו בזמן אמת.
        <br />
        בנה תיק השקעות חכם עם בינה מלאכותית.
      </p>

      {/* --- סטטוס מערכת --- */}
      <div className="border border-green-900/50 bg-green-900/10 p-4 rounded-lg text-center backdrop-blur-sm w-full max-w-md">
        <p className="text-sm text-green-400 font-mono">
           ● מערכת מחוברת לענן (Neon DB)
        </p>
        <p className="text-slate-300 font-bold mt-1">
           משתמשים רשומים: {users.length === 0 ? 1 : users.length}
        </p>
      </div>

      {/* --- רשימת המניות (Grid) --- */}
      {currentUser && (
        <div className="w-full max-w-4xl mt-4">
          <h2 className="text-2xl font-bold text-slate-200 mb-4 text-center">
             התיק של {currentUser.name}:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.stocks.map((stock) => (
              <Card key={stock.id} className="bg-slate-900 border-slate-800 text-slate-100 hover:border-blue-500 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">{stock.symbol}</CardTitle>
                  <span className="text-emerald-400 font-mono text-sm">▲ Live</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$185.32</div>
                  <p className="text-xs text-slate-500">{stock.name}</p>
                  <p className="text-[10px] text-slate-600 mt-3">
                    הוסף: {new Date(stock.addedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* --- כפתורי פעולה --- */}
      <div className="flex gap-4 mt-8">
        
        {/* 2. כאן החלפנו את הכפתור הרגיל בכפתור האינטראקטיבי שלנו */}
        <AddStockDialog />
        
        <Button variant="outline" className="text-black bg-white hover:bg-slate-200 border-none text-lg px-8 py-6">
          תיעוד API
        </Button>
      </div>

    </div>
  );
}