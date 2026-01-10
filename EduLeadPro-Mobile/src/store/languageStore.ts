import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { translations, TranslationKey } from '../i18n/translations';

type Language = 'en' | 'hi' | 'mr';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'en',
            setLanguage: (language) => set({ language }),
            t: (key) => {
                const lang = get().language;
                // Fallback to English if translation missing
                return translations[lang][key] || translations['en'][key] || key;
            },
        }),
        {
            name: 'language-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
