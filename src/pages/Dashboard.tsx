
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Languages, HistoryIcon, ArrowDown, FileType, Check, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { uploadDocument, fetchTranslations, setFile, setTargetLanguage, clearUpload, deleteTranslation } from "@/store/slices/translationSlice";
import { translationApi } from "@/services/translationApi";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { translations, currentUpload, status } = useAppSelector((state) => state.translation);
  const [dragActive, setDragActive] = useState(false);
  const { t, language } = useLanguage();

  const LANGUAGES = [
    { code: "es", name: t('spanish') },
    { code: "fr", name: t('french') },
    { code: "de", name: t('german') },
    { code: "it", name: t('italian') },
    { code: "zh", name: t('chinese') },
    { code: "ja", name: t('japanese') },
    { code: "ko", name: t('korean') },
    { code: "ru", name: t('russian') },
    { code: "pt", name: t('portuguese') },
    { code: "ar", name: t('arabic') },
  ];

  useEffect(() => {
    dispatch(fetchTranslations());
  }, [dispatch]);

  // Add debug logs to monitor state changes
  useEffect(() => {
    console.log("Current upload status:", currentUpload.status);
    console.log("Current file:", currentUpload.file?.name || "No file");
    console.log("Current target language:", currentUpload.targetLanguage);
  }, [currentUpload]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
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
      toast(t('invalidFileType'), {
        description: t('pleaseUpload'),
      });
      return;
    }

    dispatch(setFile(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault(); // Prevent form submission default behavior
    console.log("Starting upload process");
    
    if (!currentUpload.file) {
      toast(t('noFileSelected'), {
        description: t('selectDocument'),
      });
      return;
    }

    if (!currentUpload.targetLanguage) {
      toast(t('targetLanguageRequired'), {
        description: t('pleaseSelectTarget'),
      });
      return;
    }

    try {
      console.log("Dispatching uploadDocument action");
      await dispatch(uploadDocument({
        file: currentUpload.file,
        targetLanguage: currentUpload.targetLanguage,
      })).unwrap();
      
      toast(t('documentUploaded'), {
        description: t('uploadedDescription'),
      });
      
      // Clear the upload form
      dispatch(clearUpload());
      
      // Refresh translations list
      await dispatch(fetchTranslations());
      
      // Switch to history tab
      setActiveTab("history");
      
    } catch (error) {
      console.error("Upload error:", error);
      toast(t('uploadFailed'), {
        description: error?.message || t('tryAgain'),
      });
    }
  };

  const handleDownload = (translationId) => {
    window.location.href = translationApi.getDownloadUrl(translationId);
  };

  const handleDeleteTranslation = async (translationId) => {
    try {
      await dispatch(deleteTranslation(translationId)).unwrap();
      toast(t('translationDeleted'));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.message || t('deleteError'));
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
        <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('welcomeBack')}, {user?.username}. {t('manageDocuments')}
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload size={16} />
            <span>{t('uploadDocument')}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon size={16} />
            <span>{t('translationHistory')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('translateDocument')}</CardTitle>
              <CardDescription>
                {t('uploadDescription')}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpload}>
              <CardContent className="space-y-6">
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
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => dispatch(setFile(null))}
                        >
                          {t('remove')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">{t('fileUploadHeader')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('fileUploadDesc')}
                        </p>
                        <Input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                        <Button type="button" asChild variant="outline">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            {t('browseFiles')}
                          </label>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-language">{t('targetLanguage')}</Label>
                  <Select 
                    value={currentUpload.targetLanguage} 
                    onValueChange={(value) => dispatch(setTargetLanguage(value))}
                  >
                    <SelectTrigger id="target-language" className="w-full">
                      <SelectValue placeholder={t('selectLanguage')} />
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
                  type="submit"
                  className="w-full"
                  disabled={currentUpload.status === "uploading" || !currentUpload.file}
                >
                  {currentUpload.status === "uploading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    t('translateButton')
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('translationHistory')}</CardTitle>
              <CardDescription>
                {t('viewStatus')}
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
                    {t('noTranslations')}
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("upload")}
                    className="mt-2"
                  >
                    {t('uploadFirst')}
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
                          ) : translation.status === "pending" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : translation.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          <span className={`text-sm capitalize ${
                            translation.status === "failed" ? "text-destructive" : 
                            translation.status === "completed" ? "text-green-500" : ""
                          }`}>
                            {t(translation.status)}
                          </span>
                        </div>

                        {translation.status === "completed" && translation.downloadUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDownload(translation.id)}
                          >
                            {t('download')}
                          </Button>
                        )}
                        
                        {translation.status === "failed" && translation.errorMessage && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => {
                              toast(t('translationError'), {
                                description: translation.errorMessage || "Unknown error occurred",
                              });
                            }}
                          >
                            {t('viewError')}
                          </Button>
                        )}
                        
                        {/* Add delete button with confirmation dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground border-muted hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('deleteTranslation')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('deleteConfirmation')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTranslation(translation.id)}>
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
