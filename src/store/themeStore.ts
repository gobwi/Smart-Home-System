import { create } from 'zustand';

interface ThemeState {
  darkMode: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  darkMode: false,

  initializeTheme: () => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    set({ darkMode: isDark });
    document.documentElement.classList.toggle('dark', isDark);
  },

  toggleTheme: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newDarkMode);
      return { darkMode: newDarkMode };
    });
  },
}));
