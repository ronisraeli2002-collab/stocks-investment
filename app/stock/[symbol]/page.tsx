import { getHistory, getLatestPrice, getStockNews } from "@/app/actions";
import { StockChart } from "@/components/StockChart";
import { StockNews } from "@/components/StockNews";
import { StockAgentChat } from "@/components/StockAgentChat";
import { ArrowRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";

// הגדרה שמחייבת את הדף להיות דינמי
export const dynamic = "force-dynamic";

// שים לב לשינוי כאן: params מוגדר כ-Promise
export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  
  // 1. קודם כל עושים await ל-params (התיקון הנדרש ל-Next.js 15)
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  // 2. שליפת כל הנתונים במקביל לביצועים מקסימליים
  const [historyData, liveData, newsData] = await Promise.all([
    getHistory(symbol),      // היסטוריה לגרף
    getLatestPrice(symbol),  // מחיר עדכני
    getStockNews(symbol)     // חדשות
  ]);

  const isPositive = liveData?.change >= 0;
  const color = isPositive ? "#10b981" : "#ef4444"; // ירוק או אדום

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8" dir="rtl">
      
      {/* כפתור חזרה */}
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition group">
        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
        חזרה לתיק ההשקעות
      </Link>

      {/* --- כותרת ראשית ונתונים --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">{symbol}</h1>
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-medium border border-slate-700">
                    {liveData?.name}
                </span>
            </div>
        </div>
        
        <div className="text-left flex flex-col items-end">
            <div className="text-4xl font-mono font-bold flex items-center gap-1">
                <span className="text-slate-500 text-2xl">$</span>
                {liveData?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-xl font-medium flex items-center gap-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {liveData?.change > 0 ? "+" : ""}{liveData?.change?.toFixed(2)}%
            </div>
        </div>
      </div>

      {/* --- הגריד הראשי --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* עמודה ימנית רחבה: גרף וחדשות */}
        <div className="lg:col-span-2 space-y-8 max-h-screen overflow-y-auto pr-4">
            
            {/* גרף */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-1">
                <StockChart data={historyData} color={color} />
            </div>
            
            {/* חדשות */}
            <div className="pt-4">
                <StockNews news={newsData} />
            </div>
        </div>

        {/* עמודה שמאלית: ה-Agent החכם */}
        <div className="lg:col-span-1">
            <div className="sticky top-6">
                <StockAgentChat symbol={symbol} />
            </div>
        </div>

      </div>
    </main>
  );
}