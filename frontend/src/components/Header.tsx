import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logo from '@/images/koneLogo.png';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Toggle button clicked, current theme:', theme);
    toggleTheme();
  };

  console.log('Header rendering, current theme:', theme);

  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Retro</span>
        </Link>
        <div className="flex gap-4 items-center">
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
            type="button"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <Link to="/dashboard" className="btn-primary">
            My Retros
          </Link>
        </div>
      </div>
    </header>
  );
}
