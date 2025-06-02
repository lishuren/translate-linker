
import { Upload } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TMXEntry {
  id: string;
  filename: string;
  units_parsed: number;
  total_units: number;
  created_at: string;
}

interface TmxLibraryTableProps {
  entries: TMXEntry[];
}

const TmxLibraryTable = ({ entries }: TmxLibraryTableProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tmxLibraryTitle')}</CardTitle>
        <CardDescription>
          {t('tmxLibraryDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fileName')}</TableHead>
                <TableHead>{t('units')}</TableHead>
                <TableHead>{t('totalUnits')}</TableHead>
                <TableHead>{t('uploadTime')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.filename}</TableCell>
                  <TableCell>{entry.units_parsed}</TableCell>
                  <TableCell>{entry.total_units}</TableCell>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('noTmxFiles')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('uploadTmxHint')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TmxLibraryTable;
