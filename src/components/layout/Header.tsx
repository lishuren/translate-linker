
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/use-redux';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Header() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 container">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Link to="/" className="flex items-center gap-2">
            LingoAIO
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              {t('home')}
            </Link>
            {user?.isLoggedIn && (
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                {t('dashboard')}
              </Link>
            )}
          </nav>

          <LanguageSwitcher />
          <ThemeToggle />

          {user?.isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t('logout')}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
