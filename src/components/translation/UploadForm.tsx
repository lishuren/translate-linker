
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, X } from "lucide-react";
import { translationApi } from "@/services/translationApi";
import { useAppDispatch } from "@/hooks/use-redux";
import { useDispatch } from 'react-redux';
import { addTranslation } from '@/store/slices/translationSlice';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { DialogFooter } from "@/components/ui/dialog";

interface UploadFormProps {
  onSuccess?: () => void;
  availableProviders: string[];
}

const UploadForm = ({ onSuccess, availableProviders = [] }: UploadFormProps) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [provider, setProvider] = useState(availableProviders[0] || "openai");
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
      
      const response = await translationApi.uploadDocument(file, targetLanguage, provider);
      
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
          <SelectContent>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {availableProviders.length > 0 && (
        <div className="space-y-2">
          <Label>Translation Provider</Label>
          <RadioGroup 
            value={provider} 
            onValueChange={setProvider}
            className="flex flex-col space-y-1"
            disabled={uploading}
          >
            {availableProviders.map((p) => (
              <div key={p} className="flex items-center space-x-2">
                <RadioGroupItem value={p} id={`provider-${p}`} />
                <Label htmlFor={`provider-${p}`} className="capitalize">{p}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
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
