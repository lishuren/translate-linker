
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'EN' : '中文'}
      </span>
    </Button>
  );
}
