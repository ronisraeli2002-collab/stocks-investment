import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-950 text-white">
      {/* כותרת עם אפקט גרדיאנט */}
      <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        Smart FinDash 🚀
      </h1>
      
      <p className="text-slate-400 text-xl text-center max-w-lg">
        פלטפורמת ניתוח מניות וקריפטו בזמן אמת.
        <br />
        בנה תיק השקעות חכם עם בינה מלאכותית.
      </p>
      
      <div className="flex gap-4 mt-4">
        {/* שימוש בכפתור שהתקנו */}
        <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
          התחל עכשיו
        </Button>
        
        <Button variant="outline" className="text-black bg-white hover:bg-slate-200 border-none text-lg px-8 py-6">
          תיעוד API
        </Button>
      </div>
    </div>
  );
}