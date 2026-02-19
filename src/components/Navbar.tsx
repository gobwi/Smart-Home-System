import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import Button from './Button';
import { ROUTES } from '@/utils/constants';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { darkMode, toggleTheme } = useThemeStore();

  const handleLogout = (): void => {
    logout();
    navigate(ROUTES.LANDING);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="text-lg font-semibold">Smart Home</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
            )}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
