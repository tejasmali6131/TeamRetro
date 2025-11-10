import { Link } from 'react-router-dom';
import logo from '@/images/koneLogo.png';

export default function Header() {
  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
          <span className="text-2xl font-bold text-gray-900">Team Retro</span>
        </Link>
        <div className="flex gap-4">
          <Link to="/dashboard" className="btn-primary">
            My Retros
          </Link>
        </div>
      </div>
    </header>
  );
}
