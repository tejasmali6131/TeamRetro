import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import logo from '@/images/koneLogo.png';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Team Retro</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-300 dark:border-gray-600"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
