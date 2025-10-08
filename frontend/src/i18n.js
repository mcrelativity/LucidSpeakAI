import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'es'];
const defaultLocale = 'es';

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locales.includes(locale) ? locale : defaultLocale;
  
  return {
    locale: validLocale,  // Add this line!
    messages: (await import(`./translations/${validLocale}.js`)).default
  };
});