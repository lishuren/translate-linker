
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

import { Separator } from "@/components/ui/separator";
import TmxUploadForm from "@/components/tmx/TmxUploadForm";
import TmxLibraryTable from "@/components/tmx/TmxLibraryTable";

interface TMXUploadResponse {
  success: boolean;
  tmx_id: string;
  result: {
    filename: string;
    header: Record<string, string>;
    units_parsed: number;
    units_new: number;
    units_updated: number;
    total_units_in_memory: number;
  };
}

interface TMXEntry {
  id: string;
  filename: string;
  units_parsed: number;
  total_units: number;
  created_at: string;
}

const TmxManager = () => {
  const { t } = useLanguage();
  const [tmxEntries, setTmxEntries] = useState<TMXEntry[]>([]);

  const handleUploadSuccess = (response: TMXUploadResponse) => {
    if (response.success) {
      const newEntry: TMXEntry = {
        id: response.tmx_id,
        filename: response.result.filename,
        units_parsed: response.result.units_parsed,
        total_units: response.result.total_units_in_memory,
        created_at: new Date().toISOString()
      };
      
      setTmxEntries(prev => [newEntry, ...prev]);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        <TmxUploadForm onUploadSuccess={handleUploadSuccess} />
      </div>

      <Separator />

      <TmxLibraryTable entries={tmxEntries} />
    </div>
  );
};

export default TmxManager;
