
import { Link } from "react-router-dom";
import { useAppSelector } from "@/hooks/use-redux";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAppSelector((state) => state.auth);
  
  return (
    <footer className="py-6 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <span className="font-semibold text-lg">LingoAIO</span>
            <p className="text-sm text-muted-foreground mt-1">
              Document translation made simple
            </p>
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
