import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { AddStockDialog } from "@/components/AddStockDialog"; // וודא שהנתיב נכון אצלך (ב-ui או בחוץ)
import { getStockData } from "@/lib/finance";
import { StockCard } from "@/components/StockCard"; // הרכיב החדש!

export default async function Home() {
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

  const currentUser = users[0];
  let stocksWithData = [];
  
  if (currentUser) {
    stocksWithData = await Promise.all(
      currentUser.stocks.map(async (stock) => {
        const liveData = await getStockData(stock.symbol);
        return { ...stock, ...liveData };
      })
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 text-white p-8">
      
      <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-center">
        Smart FinDash 🚀
      </h1>
      
      <p className="text-slate-400 text-xl text-center max-w-lg">
        פלטפורמת ניתוח מניות וקריפטו בזמן אמת.
        <br />
        בנה תיק השקעות חכם עם בינה מלאכותית.
      </p>

      {/* סטטוס מערכת */}
      <div className="border border-green-900/50 bg-green-900/10 p-4 rounded-lg text-center backdrop-blur-sm w-full max-w-md">
        <p className="text-sm text-green-400 font-mono flex items-center justify-center gap-2">
            ⚡ Real-Time Updates (10s)
        </p>
        <p className="text-slate-300 font-bold mt-1">
           מניות במעקב: {currentUser?.stocks.length || 0}
        </p>
      </div>

      {currentUser && (
        <div className="w-full max-w-4xl mt-4">
          <h2 className="text-2xl font-bold text-slate-200 mb-4 text-center">
             התיק של {currentUser.name}:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocksWithData.map((stock) => (
              // השימוש ברכיב החכם!
              <StockCard 
                key={stock.id}
                id={stock.id}
                symbol={stock.symbol}
                name={stock.name}
                addedAt={stock.addedAt}
                initialPrice={stock.price}
                initialChange={stock.change}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-4 mt-8">
        <AddStockDialog />
        <Button variant="outline" className="text-black bg-white hover:bg-slate-200 border-none text-lg px-8 py-6">
          תיעוד API
        </Button>
      </div>

    </div>
  );
}