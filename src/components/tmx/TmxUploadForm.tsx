
import { useState } from "react";
import { Upload, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import axios from "axios";
import config from "@/config/environment";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface TmxUploadFormProps {
  onUploadSuccess: (response: TMXUploadResponse) => void;
}

const TmxUploadForm = ({ onUploadSuccess }: TmxUploadFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<TMXUploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.tmx')) {
        toast({
          title: t('invalidFileType'),
          description: t('pleaseUpload'),
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: t('noFileSelected'),
        description: t('selectDocument'),
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<TMXUploadResponse>(
        `${config.apiProxyEnabled ? '/api' : config.apiBaseUrl}/tmx/upload`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setUploadResult(response.data);
      
      if (response.data.success) {
        onUploadSuccess(response.data);
        
        toast({
          title: t('uploadSuccess'),
          description: `${response.data.result.units_parsed} ${t('translationUnitsProcessed')}`,
        });
      }
      
      setFile(null);
    } catch (error: any) {
      console.error("Error uploading TMX file:", error);
      toast({
        title: t('uploadFailed'),
        description: error.response?.data?.detail || t('tryAgain'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{t('uploadTmxTitle')}</CardTitle>
        <CardDescription>
          {t('uploadTmxDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tmx-file">{t('selectTmxFile')}</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="tmx-file" 
                type="file" 
                onChange={handleFileChange}
                accept=".tmx"
                className="flex-1"
              />
              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                className="whitespace-nowrap"
              >
                {uploading ? (
                  <>{t('uploading')}</>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {t('upload')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('tmxUploadHint')}
            </p>
          </div>

          {file && (
            <div className="rounded-md bg-secondary p-3">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadResult && uploadResult.success && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle>{t('uploadSuccess')}</AlertTitle>
              <AlertDescription>
                <ul className="text-sm list-disc pl-5 mt-2">
                  <li>{t('fileName')}: {uploadResult.result.filename}</li>
                  <li>{t('unitsParsed')}: {uploadResult.result.units_parsed}</li>
                  <li>{t('newUnits')}: {uploadResult.result.units_new}</li>
                  <li>{t('updatedUnits')}: {uploadResult.result.units_updated}</li>
                  <li>{t('totalUnits')}: {uploadResult.result.total_units_in_memory}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TmxUploadForm;
