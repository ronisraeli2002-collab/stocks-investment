"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addStock } from "@/app/actions";
import { useState } from "react";
import { toast } from "sonner"; // הייבוא של ההודעות

export function AddStockDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // כדי למנוע לחיצות כפולות

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    // קריאה לשרת
    const result = await addStock(formData);
    
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message); // הודעה ירוקה
      setOpen(false); // סוגר את החלון רק אם הצליח
    } else {
      toast.error(result.message); // הודעה אדומה
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
          + הוסף מניה
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle>הוספת מניה לתיק</DialogTitle>
          <DialogDescription className="text-slate-400">
            הכנס את הסימול (למשל TSLA). השם יזוהה אוטומטית.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">
              סימול
            </Label>
            <Input
              id="symbol"
              name="symbol"
              placeholder="AAPL / TSLA / NVDA"
              className="col-span-3 bg-slate-800 border-slate-700 text-white uppercase"
              required
              autoFocus // שמים את הסמן ישר בתיבה
              disabled={isLoading}
            />
          </div>
          
          {/* מחקנו את שדה ה-NAME כבקשתך */}
          
          <div className="flex justify-end mt-4">
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
              disabled={isLoading}
            >
              {isLoading ? "בודק..." : "שמור מניה"}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}