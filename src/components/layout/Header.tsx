import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="font-bold">
            LingoAIO
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {!isLoggedIn && (
              <>
                <Link to="/" className={`${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'} px-4 py-2 hover:text-foreground transition-colors`}>
                  Home
                </Link>
                <Link to="/login" className={`${pathname === '/login' ? 'text-foreground' : 'text-muted-foreground'} px-4 py-2 hover:text-foreground transition-colors`}>
                  Login
                </Link>
              </>
            )}
            
            {isLoggedIn && (
              <>
                <Link to="/dashboard" className={`${pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'} px-4 py-2 hover:text-foreground transition-colors`}>
                  Dashboard
                </Link>
                <Link to="/tmx-manager" className={`${pathname === '/tmx-manager' ? 'text-foreground' : 'text-muted-foreground'} px-4 py-2 hover:text-foreground transition-colors`}>
                  TMX Manager
                </Link>
              </>
            )}
            
            {mounted && <ModeToggle />}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
