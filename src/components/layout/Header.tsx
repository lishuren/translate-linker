
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { logout } from "@/store/slices/authSlice";
import { LogOut, User, Home, History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import config from "@/config/environment";

export function Header() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block">
              {config.appName}
            </span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {user?.isLoggedIn ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {t('dashboard')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {t('translationHistory')}
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('login')}
                </Link>
              </Button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
