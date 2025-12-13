"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getPortfolioSnapshot, addStock, removeStock } from "@/app/actions";
import { StockCard } from "@/components/StockCard";
import { PortfolioDistribution } from "@/components/PortfolioDistribution";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, RefreshCw, TrendingUp, Coins, Activity, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Stock {
  id: number;
  symbol: string;
  name?: string;
  price: number;
  change: number;
  quantity: number;
}

interface DashboardProps {
  initialData: Stock[];
}

export function LiveDashboard({ initialData }: DashboardProps) {
  const [stocks, setStocks] = useState<Stock[]>(initialData);
  const [newSymbol, setNewSymbol] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- לוגיקה זהה לקוד הקודם ---
  useEffect(() => { setStocks(initialData); }, [initialData]);

  const refreshData = useCallback(async () => {
    try {
      const freshData = await getPortfolioSnapshot();
      if (freshData) {
        setStocks(freshData);
        setLastUpdated(new Date());
      }
    } catch (error) { console.error("Failed to refresh"); }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const { totalValue, totalChangeValue, isPositive } = useMemo(() => {
    const value = stocks.reduce((acc, s) => acc + s.price * s.quantity, 0);
    const changeValue = stocks.reduce((acc, s) => {
      const startPrice = s.price / (1 + s.change / 100);
      return acc + s.price * s.quantity - startPrice * s.quantity;
    }, 0);
    return { totalValue: value, totalChangeValue: changeValue, isPositive: changeValue >= 0 };
  }, [stocks]);

  const handleAddStock = async () => {
    if (!newSymbol) return;
    const quantityNum = parseInt(newQuantity);
    if (isNaN(quantityNum) || quantityNum < 1) { toast.error("כמות לא תקינה"); return; }
    setLoading(true);
    try {
      const result = await addStock(newSymbol, quantityNum);
      if (result.success) {
        toast.success(`נוספו ${quantityNum} יחידות של ${newSymbol}`);
        setNewSymbol(""); setNewQuantity("1"); await refreshData();
      } else { toast.error(result.message || "שגיאה"); }
    } catch (e) { toast.error("שגיאה בתקשורת"); } finally { setLoading(false); }
  };

  const handleDeleteStock = async (id: number, symbol: string) => {
    if (!confirm(`למחוק את ${symbol}?`)) return;
    try {
      const result = await removeStock(id);
      if (result.success) {
        setStocks((prev) => prev.filter((s) => s.id !== id));
        toast.success("נמחק בהצלחה"); await refreshData();
      }
    } catch (e) { toast.error("שגיאה במחיקה"); }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 px-4" dir="rtl">
      
      {/* כותרת עדינה */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
           <Wallet className="text-blue-500" size={24}/> התיק שלי
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
            <Activity size={12} className="text-emerald-500 animate-pulse" />
            עודכן: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* --- אזור הנתונים הראשי --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* כרטיס שווי ראשי - הוספתי min-h כדי שיהיה גובה אחיד */}
        <Card className="md:col-span-2 bg-slate-900/80 border-slate-800 text-white shadow-xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-center min-h-[320px]">
            {/* רקע דקורטיבי */}
            <div className={`absolute top-0 left-0 w-1 h-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />

            <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6 h-full">
                
                {/* צד ימין: המספרים */}
                <div className="text-center sm:text-right space-y-2 flex flex-col justify-center">
                    <span className="text-slate-400 text-sm font-medium">שווי תיק כולל</span>
                    <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                        <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-mono">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"} justify-center sm:justify-start`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        <span className="font-mono">
                             ${Math.abs(totalChangeValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="opacity-70 text-xs">יומי</span>
                    </div>
                </div>

                {/* קו מפריד במובייל */}
                <div className="w-full h-[1px] bg-slate-800 sm:hidden"></div>

                {/* צד שמאל: סטטיסטיקה */}
                <div className="flex gap-8 text-center items-center">
                    <div>
                        <div className="text-2xl font-bold text-white">{stocks.length}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">נכסים</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-400">{stocks.filter(s => s.change > 0).length}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">עולים</div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* גרף דונאט - גובה קבוע וגדול יותר */}
        <div className="h-[320px] w-full">
            <PortfolioDistribution stocks={stocks} />
        </div>
      </div>

      {/* --- שורת הוספה --- */}
      <Card className="bg-slate-900/50 border-slate-800/60 p-3 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-[2] w-full">
            <Input
              placeholder="סימול (למשל: NVDA)..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
              className="bg-slate-950 border-slate-700 text-white pr-9 h-10 text-sm focus:border-blue-500/50 focus:ring-blue-500/20"
            />
            <Plus className="absolute right-3 top-2.5 text-slate-500" size={16} />
          </div>

          <div className="relative flex-1 w-full sm:w-auto">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="כמות"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
              className="bg-slate-950 border-slate-700 text-white pr-9 h-10 text-sm"
            />
            <Coins className="absolute right-3 top-2.5 text-yellow-500/60" size={16} />
          </div>

          <Button
            onClick={handleAddStock}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white h-10 px-6 font-medium shadow-lg shadow-blue-900/20"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : "הוסף"}
          </Button>
        </div>
      </Card>

      {/* --- רשימת מניות --- */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 mb-2">פירוט נכסים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
            <StockCard
                key={stock.id || stock.symbol}
                {...stock}
                onDelete={() => handleDeleteStock(stock.id, stock.symbol)}
            />
            ))}
        </div>
      </div>

    </div>
  );
}