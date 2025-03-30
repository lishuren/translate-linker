
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-semibold text-lg">LingoAIO</span>
            <p className="text-sm text-muted-foreground mt-1">
              Document translation made simple
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            &copy; {currentYear} LingoAIO. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
