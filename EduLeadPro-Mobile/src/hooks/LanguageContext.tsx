
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../translations';

interface LanguageContextType {
    t: (key: TranslationKey) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = useCallback((key: TranslationKey): string => {
        return translations[language][key] || translations['en'][key] || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ t, language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
