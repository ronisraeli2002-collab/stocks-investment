"use client";

import { useState, useEffect } from "react";
import { getPortfolioSnapshot } from "@/app/actions";
import { StockCard } from "@/components/StockCard";
import { PortfolioSummary } from "@/components/PortfolioSummary";

interface DashboardProps {
  initialData: any[];
}

export function LiveDashboard({ initialData }: DashboardProps) {
  const [stocks, setStocks] = useState(initialData);

  useEffect(() => {
    setStocks(initialData);
  }, [initialData]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const freshData = await getPortfolioSnapshot();
        if (freshData && freshData.length > 0) {
          setStocks(freshData);
        }
      } catch (error) {
        console.error("Failed to refresh dashboard");
      }
    };

    // בקשה אחת מרוכזת שמביאה הכל!
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // חישוב הסיכומים קורה כאן - במקום אחד מרכזי
  const totalValue = stocks.reduce((acc, s) => acc + (s.price * s.quantity), 0);
  const totalChange = stocks.reduce((acc, s) => acc + ((s.price * s.quantity) * (s.change / 100)), 0);

  return (
    <div className="w-full max-w-4xl space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* העברת הנתונים החיים לכרטיס הסיכום - עכשיו הם מסונכרנים בול! */}
        <PortfolioSummary 
          value={totalValue} 
          change={totalChange} 
        />
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center shadow-lg">
            <div className="text-sm text-green-400 font-mono flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Optimized Sync
            </div>
            <div className="text-slate-300 font-bold text-center">
                מניות במעקב: {stocks.length}
                <br />
                <span className="text-xs text-slate-500 font-normal">בקשה אחת / 30 שניות</span>
            </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4 pr-2 border-r-4 border-blue-500 text-right">
           הנכסים שלי
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
          {stocks.map((stock: any) => (
            <StockCard 
              key={stock.symbol}
              id={stock.id || 0}
              symbol={stock.symbol}
              name={stock.name || stock.symbol}
              quantity={stock.quantity}
              addedAt={stock.addedAt || new Date()}
              price={stock.price}
              change={stock.change}
            />
          ))}
        </div>
      </div>
    </div>
  );
}