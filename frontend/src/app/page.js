// src/app/page.js
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default function HomeRedirect() {
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Detecta idioma del navegador
  const locale = acceptLanguage.toLowerCase().includes('es') ? 'es' : 'en';

  redirect(`/${locale}`);
}
