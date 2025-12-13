// הפונקציה הזו רצה בשרת של Next.js ופונה לשרת של Python
export async function analyzeStockWithPython(symbol: string) {
  try {
    // פניה לשרת המקומי של פייתון
    const response = await fetch(`http://127.0.0.1:8000/analyze/${symbol}`, {
      cache: 'no-store', // אנחנו רוצים ניתוח טרי תמיד, לא מהקאש
    });

    if (!response.ok) {
      throw new Error("Python service is unreachable");
    }

    const data = await response.json();
    return data; // מחזירים את התשובה (Bullish/Bearish)
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
}