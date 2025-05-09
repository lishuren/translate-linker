
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, User } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { logout } from "@/store/slices/authSlice";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate("/");
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      })
      .catch((error) => {
        console.error("Logout error:", error);
        toast({
          variant: "destructive",
          title: "Logout failed",
          description: "There was an issue logging out. Please try again.",
        });
      });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-glass shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">LingoAIO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            {user?.isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  <span className="text-sm font-medium">{user.username || user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="text-foreground/80 hover:text-foreground"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Login
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-glass"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <Link
                to="/"
                className="block py-2 text-foreground/80 hover:text-foreground"
              >
                Home
              </Link>
              {user?.isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block py-2 text-foreground/80 hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2 py-2">
                    <User size={16} className="text-primary" />
                    <span className="text-sm font-medium">{user.username || user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full justify-start py-2 text-foreground/80 hover:text-foreground"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block py-2 text-foreground/80 hover:text-foreground"
                >
                  Login
                </Link>
              )}
              <div className="flex items-center py-2">
                <span className="text-foreground/80 mr-2">Theme:</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
