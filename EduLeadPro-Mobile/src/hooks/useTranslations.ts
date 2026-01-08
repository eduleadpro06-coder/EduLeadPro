
import { useState, useCallback } from 'react';
import { translations, Language, TranslationKey } from '../translations';

export function useTranslations() {
    const [language, setLanguage] = useState<Language>('en');

    const t = useCallback((key: TranslationKey): string => {
        return translations[language][key] || translations['en'][key] || key;
    }, [language]);

    return { t, language, setLanguage };
}
