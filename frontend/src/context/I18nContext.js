"use client";
import { createContext, useState, useContext } from 'react';
import es from '@/translations/es';
import en from '@/translations/en';

const I18nContext = createContext();

const translations = { es, en };

export const I18nProvider = ({ children, initialLocale }) => {
    const [locale, setLocale] = useState(initialLocale || 'es');

    const t = (key) => {
        const keys = key.split('.');
        let result = translations[locale];
        for (const k of keys) {
            result = result?.[k];
        }
        return result || key;
    };

    return (
        <I18nContext.Provider value={{ t, locale, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslations = () => useContext(I18nContext);
