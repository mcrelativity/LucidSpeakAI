"use client";

import { AuthProvider } from "@/context/AuthContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export function Providers({ children, locale }) {
  const initialPayPalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "subscription",
    vault: true,
  };

  return (
    <PayPalScriptProvider options={initialPayPalOptions}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </PayPalScriptProvider>
  );
}
