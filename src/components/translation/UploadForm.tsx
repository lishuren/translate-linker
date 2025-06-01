
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadFormProps {
  onUpload: (file: File, targetLanguage: string, llmProvider?: string) => void;
  isUploading?: boolean;
}

export function UploadForm({ onUpload, isUploading = false }: UploadFormProps) {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const languages = [
    { value: "chinese", label: t('chinese') },
    { value: "english", label: t('english') },
    { value: "spanish", label: t('spanish') },
    { value: "french", label: t('french') },
    { value: "german", label: t('german') },
    { value: "japanese", label: t('japanese') },
    { value: "korean", label: t('korean') },
    { value: "russian", label: t('russian') },
    { value: "portuguese", label: t('portuguese') },
    { value: "italian", label: t('italian') },
    { value: "dutch", label: t('dutch') },
    { value: "arabic", label: t('arabic') },
    { value: "hindi", label: t('hindi') },
    { value: "bengali", label: t('bengali') },
    { value: "turkish", label: t('turkish') },
    { value: "vietnamese", label: t('vietnamese') },
    { value: "thai", label: t('thai') },
    { value: "indonesian", label: t('indonesian') },
    { value: "greek", label: t('greek') },
    { value: "polish", label: t('polish') },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && targetLanguage) {
      onUpload(selectedFile, targetLanguage);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('uploadDocument')}</CardTitle>
        <CardDescription>{t('uploadDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('selectDocument')}</Label>
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{t('fileUploadHeader')}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('fileUploadDesc')}
                </p>
                <Button type="button" variant="outline">
                  {t('browseFiles')}
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Target Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="target-language">{t('targetLanguage')}</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedFile || !targetLanguage || isUploading}
          >
            {isUploading ? t('uploading') : t('translateButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
