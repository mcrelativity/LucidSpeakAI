import "./globals.css";

export const metadata = {
  title: "LucidSpeak.ai",
  description: "Tu Coach de Comunicación Personal con IA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  );
}