import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs'; // הייבוא שכבר קיים אצלך

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart FinDash 🚀",
  description: "Financial Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 1. העטיפה הגדולה של Clerk שחייבת להיות הכי בחוץ
    <ClerkProvider>
      {/* הוספתי dir="rtl" ו-lang="he" כדי שהעיצוב יסתדר בעברית */}
      <html lang="he" dir="rtl" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster /> {/* ההודעות הקופצות */}
        </body>
      </html>
    </ClerkProvider>
  );
}