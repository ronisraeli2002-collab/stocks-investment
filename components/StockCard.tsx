"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getLatestPrice, removeStock, getHistory } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StockChart } from "@/components/StockChart";

interface StockProps {
  id: number;
  symbol: string;
  name: string;
  addedAt: Date;
  initialPrice: number;
  initialChange: number;
}

export function StockCard({ id, symbol, name, addedAt, initialPrice, initialChange }: StockProps) {
  const [price, setPrice] = useState(initialPrice);
  const [change, setChange] = useState(initialChange);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const newData = await getLatestPrice(symbol);
      setPrice(newData.price);
      setChange(newData.change);

      const historyData = await getHistory(symbol);
      setHistory(historyData);
    };

    fetchData();

    const interval = setInterval(async () => {
      setIsLoading(true);
      try {
        const newData = await getLatestPrice(symbol);
        setPrice(newData.price);
        setChange(newData.change);
      } catch (error) {
        console.error("Failed to update stock:", symbol);
      } finally {
        setIsLoading(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [symbol]);

  // חישובים לוגיים
  const isPositive = change >= 0;
  const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
  const chartColor = isPositive ? "#34d399" : "#f87171";
  const arrow = isPositive ? "▲" : "▼";

  // חישוב תשואה ל-6 חודשים
  let sixMonthChange = 0;
  let isSixMonthPositive = true;

  if (history.length > 0) {
      const startPrice = history[0].price;
      sixMonthChange = ((price - startPrice) / startPrice) * 100;
      isSixMonthPositive = sixMonthChange >= 0;
  }

  return (
    <Card className={`relative group bg-slate-900 border-slate-800 text-slate-100 transition-all duration-500 ${isLoading ? "border-blue-500/50" : ""}`}>
      
      <button
        onClick={async (e) => {
           e.stopPropagation();
           if(confirm("למחוק את המניה מהרשימה?")) {
             const result = await removeStock(id);
             if (result?.success) toast.success("המניה נמחקה בהצלחה");
           }
        }}
        className="absolute top-3 left-3 z-10 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
        title="מחק מניה"
      >
        <Trash2 size={16} />
      </button>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-12">
        <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
        <span className={`font-mono text-sm ${colorClass} flex items-center gap-1`}>
          {arrow} {change.toFixed(2)}%
          <span className="relative flex h-2 w-2 ml-1">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </span>
      </CardHeader>
      
      <CardContent className="pl-12">
        <div className={`text-2xl font-bold transition-colors duration-300 ${isLoading ? "text-slate-400" : "text-white"}`}>
            ${price.toFixed(2)}
        </div>
        <p className="text-xs text-slate-500 truncate">{name}</p>
        
        {/* אזור הגרף + הנתון החדש */}
        <div className="mt-4">
            {history.length > 0 && (
                <div className="flex justify-end mb-1">
                    <span className={`text-[10px] font-mono font-bold ${isSixMonthPositive ? 'text-emerald-400' : 'text-red-400'} bg-slate-800/50 px-1.5 py-0.5 rounded`}>
                        6M: {isSixMonthPositive ? "+" : ""}{sixMonthChange.toFixed(2)}%
                    </span>
                </div>
            )}
            
            <StockChart data={history} color={chartColor} />
        </div>
        
      </CardContent>
    </Card>
  );
}