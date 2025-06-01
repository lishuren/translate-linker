import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Upload, Loader2, RefreshCw, Download, Trash2, AlertCircle, CheckCircle2, Clock, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { fetchTranslations, deleteTranslation, TranslationStatus, updateTranslationStatus } from "@/store/slices/translationSlice";
import { translationApi } from "@/services/translationApi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import UploadForm from "@/components/translation/UploadForm";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { translations, status } = useAppSelector((state) => state.translation);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<any>(null);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate("/login");
      return;
    }

    // Fetch translations when component mounts
    dispatch(fetchTranslations());

    // Check for available LLM providers
    const checkProviders = async () => {
      try {
        const providers = await translationApi.getAvailableLlmProviders();
        setAvailableProviders(providers);
        
        // Also get API key status
        const keyStatus = await translationApi.checkApiKeyStatus();
        setApiKeyStatus(keyStatus);
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };
    
    checkProviders();
  }, [dispatch, navigate, user]);

  // Set up polling for in-progress translations
  useEffect(() => {
    const inProgressTranslations = translations.filter(
      t => t.status === TranslationStatus.PENDING || t.status === TranslationStatus.PROCESSING
    );
    
    if (inProgressTranslations.length === 0) return;
    
    const intervalId = setInterval(async () => {
      for (const translation of inProgressTranslations) {
        try {
          const response = await translationApi.checkTranslationStatus(translation.id);
          
          if (response.status !== translation.status) {
            dispatch(updateTranslationStatus({
              id: translation.id,
              status: response.status,
              errorMessage: response.errorMessage
            }));
            
            // Show notification for completed or failed translations
            if (response.status === TranslationStatus.COMPLETED) {
              toast({
                title: "Translation Completed",
                description: `Your document "${translation.originalFileName}" has been translated.`,
              });
            } else if (response.status === TranslationStatus.FAILED) {
              toast({
                title: "Translation Failed",
                description: response.errorMessage || "An error occurred during translation.",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error(`Error checking status for translation ${translation.id}:`, error);
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [translations, dispatch, toast]);

  const handleRefresh = () => {
    setIsLoading(true);
    dispatch(fetchTranslations())
      .finally(() => setIsLoading(false));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this translation?")) {
      dispatch(deleteTranslation(id));
    }
  };

  const handleDownload = (id: string, filename: string) => {
    const downloadUrl = translationApi.getDownloadUrl(id);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.PENDING:
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case TranslationStatus.PROCESSING:
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
      case TranslationStatus.COMPLETED:
        return <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case TranslationStatus.FAILED:
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTranslations = translations.filter(translation => {
    if (selectedTab === "all") return true;
    if (selectedTab === "completed") return translation.status === TranslationStatus.COMPLETED;
    if (selectedTab === "processing") return translation.status === TranslationStatus.PROCESSING || translation.status === TranslationStatus.PENDING;
    if (selectedTab === "failed") return translation.status === TranslationStatus.FAILED;
    return true;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your translation projects and documents
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Add TMX Manager Button */}
          <Link to="/tmx-manager">
            <Button variant="outline" className="h-9">
              TMX Manager
            </Button>
          </Link>
          
          <Button variant="outline" className="h-9" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
           <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload Document for Translation</DialogTitle>
                  <DialogDescription>
                    Upload a document to translate it to your desired language.
                  </DialogDescription>
                </DialogHeader>
                <UploadForm 
                  onSuccess={() => setIsUploadDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* API Key Status Alert */}
      {apiKeyStatus && apiKeyStatus.api_key_status && 
        apiKeyStatus.api_key_status.configured_providers_count === 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No API Keys Configured</AlertTitle>
          <AlertDescription>
            No LLM provider API keys are configured. Please contact your administrator to set up API keys.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Translations</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="processing">In Progress</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Translation History</CardTitle>
              <CardDescription>
                View and manage your document translations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "loading" ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTranslations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Target Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTranslations.map((translation) => (
                      <TableRow key={translation.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileType className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]" title={translation.originalFileName}>
                              {translation.originalFileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {translation.targetLanguage.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(translation.status)}
                          {translation.status === TranslationStatus.PROCESSING && (
                            <Progress value={45} className="h-1 mt-2" />
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(translation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {translation.status === TranslationStatus.COMPLETED && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownload(translation.id, translation.originalFileName)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(translation.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileType className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No translations found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedTab === "all" 
                      ? "Upload a document to get started with translation" 
                      : `No ${selectedTab} translations found`}
                  </p>
                  {selectedTab === "all" && (
                    <Button 
                      onClick={() => setIsUploadDialogOpen(true)} 
                      className="mt-4"
                    >
                     
                      Upload Document
                    </Button>
                  )}
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
