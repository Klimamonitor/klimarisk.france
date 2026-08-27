import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import text from "../assets/text";

export type Language = "en" | "fr";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  l: (entry: Record<Language, string> | undefined) => string | undefined;
}

const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "fr", 

      setLanguage: (lang) => set({ language: lang }),

      l: (entry) => (entry ? entry[get().language] : undefined),
    }),
    {
      name: "language-store",
      partialize: (state) => ({
        language: state.language,
      }),
    }
  )
);

export default useLanguageStore;
export { text as t };

// Gestion des nombres ordinaux en français et en anglais
export function ordinal(n: number, language: Language): string {
  if (language === "fr") {
    if (n === 1) return "1er";
    return `${n}e`;
  }

  // Règle pour l'anglais
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`;
  }

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}