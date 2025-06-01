
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check } from "lucide-react";
import { translationApi } from "@/services/translationApi";
import { useAppDispatch } from "@/hooks/use-redux";
import { addTranslation } from '@/store/slices/translationSlice';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DialogFooter } from "@/components/ui/dialog";

interface UploadFormProps {
  onSuccess?: () => void;
}

const LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-tw", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "hu", name: "Hungarian" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "hr", name: "Croatian" },
  { code: "sr", name: "Serbian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ro", name: "Romanian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "mr", name: "Marathi" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "my", name: "Myanmar" },
  { code: "km", name: "Khmer" },
  { code: "lo", name: "Lao" },
  { code: "ka", name: "Georgian" },
  { code: "am", name: "Amharic" },
  { code: "sw", name: "Swahili" },
  { code: "zu", name: "Zulu" },
  { code: "af", name: "Afrikaans" },
  { code: "is", name: "Icelandic" },
  { code: "mt", name: "Maltese" },
  { code: "cy", name: "Welsh" },
  { code: "ga", name: "Irish" },
  { code: "eu", name: "Basque" },
  { code: "ca", name: "Catalan" },
  { code: "gl", name: "Galician" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "mk", name: "Macedonian" },
  { code: "sq", name: "Albanian" },
  { code: "be", name: "Belarusian" },
  { code: "uk", name: "Ukrainian" },
  { code: "az", name: "Azerbaijani" },
  { code: "kk", name: "Kazakh" },
  { code: "ky", name: "Kyrgyz" },
  { code: "tg", name: "Tajik" },
  { code: "uz", name: "Uzbek" },
  { code: "mn", name: "Mongolian" },
  { code: "bo", name: "Tibetan" },
  { code: "hy", name: "Armenian" },
];

const UploadForm = ({ onSuccess }: UploadFormProps) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to translate",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      // Upload without provider - let backend use user settings
      const response = await translationApi.uploadDocument(file, targetLanguage);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Your document has been uploaded for translation"
        });
        
        // Add to translation state
        dispatch(addTranslation(response.translation));
        
        // Reset form
        setFile(null);
        
        // Call success callback if provided
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Upload Failed",
          description: response.errorMessage || "An error occurred during upload",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Select Document</Label>
        <Input 
          id="file" 
          type="file" 
          onChange={handleFileChange} 
          accept=".txt,.pdf,.docx,.doc,.md"
          disabled={uploading}
        />
        {file && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="language">Target Language</Label>
        <Select 
          value={targetLanguage} 
          onValueChange={setTargetLanguage}
          disabled={uploading}
        >
          <SelectTrigger id="language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {LANGUAGES.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-center text-muted-foreground">
            {progress < 100 ? "Uploading..." : "Processing..."}
          </p>
        </div>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onSuccess} disabled={uploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload for Translation"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default UploadForm;
