"use client";

import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export function Providers({ children, locale }) {
  const initialPayPalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "subscription",
    vault: true,
  };

  return (
    <I18nProvider initialLocale={locale}>
      <PayPalScriptProvider options={initialPayPalOptions}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PayPalScriptProvider>
    </I18nProvider>
  );
}
