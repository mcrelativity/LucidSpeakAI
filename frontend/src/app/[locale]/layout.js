import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import i18nConfig from '@/i18n';
import { Providers } from "@/app/providers";
import ClientLayout from "@/components/ClientLayout";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LucidSpeak",
  description: "Mejora tu comunicación",
};

export default async function LocaleLayout({ children, params: { locale } }) {
  const { messages } = await i18nConfig({ locale });
  
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale}>
            <ClientLayout>
              {children}
            </ClientLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}