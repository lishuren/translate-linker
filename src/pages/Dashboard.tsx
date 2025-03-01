
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Languages, HistoryIcon, ArrowDown, FileType, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { uploadDocument, fetchTranslations, setFile, setTargetLanguage, clearUpload } from "@/store/slices/translationSlice";
import { format } from "date-fns";

const LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { translations, currentUpload, status } = useAppSelector((state) => state.translation);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    dispatch(fetchTranslations());
  }, [dispatch]);

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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is a document
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a document file (PDF, Word, Excel, PowerPoint, or Text).",
        variant: "destructive",
      });
      return;
    }

    dispatch(setFile(file));
  };

  const handleUpload = async () => {
    if (!currentUpload.file) {
      toast({
        title: "No File Selected",
        description: "Please select a document to translate.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUpload.targetLanguage) {
      toast({
        title: "Target Language Required",
        description: "Please select a target language for translation.",
        variant: "destructive",
      });
      return;
    }

    await dispatch(uploadDocument({
      file: currentUpload.file,
      targetLanguage: currentUpload.targetLanguage,
    }));

    if (currentUpload.status === "success") {
      toast({
        title: "Document Uploaded",
        description: "Your document is being translated. You'll receive an email when it's ready.",
      });
      dispatch(clearUpload());
      setActiveTab("history");
    } else if (currentUpload.status === "error") {
      toast({
        title: "Upload Failed",
        description: currentUpload.error || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}. Manage your document translations here.
        </p>
      </motion.div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload size={16} />
            <span>Upload Document</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon size={16} />
            <span>Translation History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Translate a Document</CardTitle>
              <CardDescription>
                Upload a document and select the target language for translation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 transition-all
                  ${dragActive ? 'border-primary bg-primary/5' : 'border-border'} 
                  ${currentUpload.file ? 'bg-secondary/30' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  {currentUpload.file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileType className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">{currentUpload.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(currentUpload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => dispatch(setFile(null))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Drop your document here</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports PDF, Word, Excel, PowerPoint, and plain text files
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Browse files
                        </label>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Target Language Selector */}
              <div className="space-y-2">
                <Label htmlFor="target-language">Target Language</Label>
                <Select 
                  value={currentUpload.targetLanguage} 
                  onValueChange={(value) => dispatch(setTargetLanguage(value))}
                >
                  <SelectTrigger id="target-language" className="w-full">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpload} 
                className="w-full"
                disabled={currentUpload.status === "uploading" || !currentUpload.file}
              >
                {currentUpload.status === "uploading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Translate Document"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Translation History</CardTitle>
              <CardDescription>
                View the status and download links for your previous translations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "loading" ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : translations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't translated any documents yet.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("upload")}
                    className="mt-2"
                  >
                    Upload your first document
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {translations.map((translation) => (
                    <div
                      key={translation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30"
                    >
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileType className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium truncate max-w-[240px]">
                            {translation.originalFileName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Languages className="h-3.5 w-3.5" />
                            <span>
                              {LANGUAGES.find(l => l.code === translation.targetLanguage)?.name || translation.targetLanguage}
                            </span>
                          </div>
                          <span>•</span>
                          <div>
                            {format(new Date(translation.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {translation.status === "completed" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : translation.status === "processing" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          ) : translation.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          <span className="text-sm capitalize">
                            {translation.status}
                          </span>
                        </div>

                        {translation.downloadUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={translation.downloadUrl} download>
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
