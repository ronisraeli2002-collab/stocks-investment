from fastapi import FastAPI
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression # ה-AI שלנו
import datetime

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "Python Brain is Active 🧠 (ML Mode)"}

@app.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    try:
        # 1. ניקוי והכנה
        clean_symbol = symbol.replace("$", "").replace("^", "").strip().upper()
        print(f"Training AI model for: {clean_symbol}...") 

        ticker = yf.Ticker(clean_symbol)
        _ = ticker.info # טריק לניעור הבאג של יאהו
        history = ticker.history(period="6mo") # לוקחים חצי שנה לאימון
        
        if history.empty:
            return {"error": f"לא נמצא מידע עבור {clean_symbol}"}

        # 2. הכנת הדאטה למודל (Data Preprocessing)
        # המחשב לא מבין תאריכים, הוא מבין מספרים. נמיר תאריך למספר רץ.
        history = history.reset_index()
        history['Date_Ordinal'] = history['Date'].map(datetime.datetime.toordinal)
        
        X = history[['Date_Ordinal']] # הפיצ'ר (הזמן)
        y = history['Close']          # המטרה (המחיר)

        # 3. אימון המודל (Training) 🏋️‍♂️
        # כאן המחשב לומד את הקו הטוב ביותר שעובר בין הנקודות
        model = LinearRegression()
        model.fit(X, y)

        # 4. ביצוע תחזית (Prediction) 🔮
        # נשאל את המודל: "מה יהיה המחיר מחר?"
        last_date_ordinal = X.iloc[-1, 0]
        next_day_ordinal = np.array([[last_date_ordinal + 1]]) # מחר
        predicted_price = model.predict(next_day_ordinal)[0]
        
        current_price = history['Close'].iloc[-1]

        # 5. ניתוח התוצאות
        trend = "Bullish 🟢" if predicted_price > current_price else "Bearish 🔴"
        diff_percent = ((predicted_price - current_price) / current_price) * 100

        return {
            "symbol": clean_symbol,
            "current_price": round(current_price, 2),
            "prediction": round(predicted_price, 2), # הנתון החדש!
            "trend": trend,
            "signal_strength": f"{round(diff_percent, 2)}%"
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": "שגיאה בניתוח הנתונים"}