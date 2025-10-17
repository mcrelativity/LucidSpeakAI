import { getRequestConfig } from 'next-intl/server';
import en from './translations/en.js';
import es from './translations/es.js';

const locales = ['en', 'es'];
const defaultLocale = 'es';

const messages = {
  en,
  es
};

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locales.includes(locale) ? locale : defaultLocale;
  
  return {
    locale: validLocale,
    messages: messages[validLocale]
  };
});