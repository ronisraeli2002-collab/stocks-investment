import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // הפונטים החדשים שלך
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // 1. חובה לייבא את זה

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
    // 2. הוספנו את className="dark" כדי שהרקע יהיה שחור
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster /> {/* 3. זה הרכיב שמציג את ההודעות הקופצות */}
      </body>
    </html>
  );
}