"use client"; // רכיב שדורש אינטראקציה בדפדפן

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
import { addStock } from "@/app/actions"; // מייבאים את הפעולה שיצרנו
import { useState } from "react";

export function AddStockDialog() {
  const [open, setOpen] = useState(false);

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
            הכנס את הסימול של המניה (למשל TSLA) ואת השם שלה.
          </DialogDescription>
        </DialogHeader>

        {/* הטופס שמפעיל את ה-Server Action */}
        <form 
          action={async (formData) => {
            await addStock(formData); // קריאה לשרת
            setOpen(false); // סגירת החלון אחרי השמירה
          }} 
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">
              סימול
            </Label>
            <Input
              id="symbol"
              name="symbol"
              placeholder="TSLA"
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              שם חברה
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Tesla Inc."
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              שמור מניה
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}