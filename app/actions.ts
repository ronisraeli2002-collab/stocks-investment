"use server"; // מילת הקסם שאומרת: הקוד הזה רץ רק בשרת!

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addStock(formData: FormData) {
  // שליפת המידע מהטופס
  const symbol = formData.get("symbol") as string;
  const name = formData.get("name") as string;

  if (!symbol || !name) return;

  // 1. מציאת המשתמש הראשון (בהמשך זה יהיה המשתמש המחובר)
  const user = await db.user.findFirst();

  if (!user) return;

  // 2. שמירה בבסיס הנתונים
  await db.stock.create({
    data: {
      symbol: symbol.toUpperCase(), // נהפוך לאותיות גדולות (aap -> AAPL)
      name: name,
      userId: user.id,
    },
  });

  // 3. ריענון המסך
  // הפקודה הזו אומרת לנקסט: "משהו השתנה בעמוד הבית, תבנה אותו מחדש"
  revalidatePath("/");
}