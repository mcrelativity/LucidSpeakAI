"use client";
import Header from "@/components/Header";

export default function ClientLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-900 text-white">
      <Header />
      {children}
    </div>
  );
}