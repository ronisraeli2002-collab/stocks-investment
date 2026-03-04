import { getPortfolioSnapshot } from "@/app/actions";
import { LiveDashboard } from "@/components/LiveDashboard";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server"; // <--- הוספתי את זה

// זה מבטיח שהדף תמיד יביא נתונים עדכניים ולא ישמור cache ישן
export const dynamic = "force-dynamic";

export default async function Home() {
  // שליפת נתונים במקביל (גם התיק וגם פרטי המשתמש)
  const initialData = await getPortfolioSnapshot();
  const user = await currentUser(); // <--- הוספתי את זה לשליפת פרטי המשתמש

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8" dir="rtl">
      
      {/* כותרת עליונה + כפתור התחברות */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Smart FinDash 🚀
            </h1>
        </div>

        {/* אם מחובר - תציג כפתור פרופיל */}
        <SignedIn>
            <div className="flex items-center gap-3">
                {/* כאן השינוי: הצגת השם הפרטי או 'משקיע' כברירת מחדל */}
                <span className="text-sm text-slate-400 hidden md:inline">
                    היי, {user?.firstName || "משקיע"}
                </span>
                <UserButton afterSignOutUrl="/" />
            </div>
        </SignedIn>

        {/* אם לא מחובר - תציג כפתור כניסה */}
        <SignedOut>
            <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold transition shadow-lg shadow-blue-900/20">
                    התחברות / הרשמה
                </button>
            </SignInButton>
        </SignedOut>
      </header>

      {/* --- תוכן למשתמשים מחוברים בלבד --- */}
      <SignedIn>
          <div className="max-w-6xl mx-auto mb-6 text-center">
             <p className="text-slate-400 text-lg">
                ניהול תיק השקעות חכם בזמן אמת
             </p>
          </div>
          <LiveDashboard initialData={initialData} />
      </SignedIn>

      {/* --- מסך נחיתה לאורחים --- */}
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                השליטה בכסף שלך <br/>
                <span className="text-blue-500">מתחילה כאן.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
                מערכת מתקדמת למעקב אחרי מניות בזמן אמת, ניתוח ביצועים וקבלת החלטות חכמות.
                הירשם עכשיו בחינם.
            </p>
            <SignInButton mode="modal">
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-xl shadow-emerald-900/20">
                    התחל עכשיו בחינם 🚀
                </button>
            </SignInButton>
        </div>
      </SignedOut>
      
    </main>
  );
}