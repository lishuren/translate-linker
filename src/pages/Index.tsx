
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileType, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { uploadDocument, setFile, setTargetLanguage, clearUpload } from "@/store/slices/translationSlice";

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

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUpload } = useAppSelector((state) => state.translation);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (user?.isLoggedIn) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

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

    toast({
      title: "Login Required",
      description: "Please login to upload and translate documents.",
    });
    
    navigate("/login");
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-center"
    >
      <div className="max-w-3xl text-center mb-16">
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full mb-4">
            Intelligent Document Translation
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Translate Documents with Precision and Speed
          </h1>
          <p className="text-xl text-muted-foreground">
            TranslateLinker uses advanced AI to translate your documents accurately 
            while preserving the original formatting and context.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <a href="#upload">Try Now</a>
          </Button>
        </motion.div>
      </div>

      {/* Upload Section */}
      <motion.div
        variants={itemVariants}
        id="upload"
        className="w-full max-w-3xl mx-auto mb-24 p-6"
      >
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Upload Your Document</h2>
          <p className="text-muted-foreground mb-8 text-center">
            Try our translation service now - upload a document and see how it works
          </p>
          
          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 transition-all mb-6
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
                    id="file-upload-home"
                    type="file"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload-home" className="cursor-pointer">
                      Browse files
                    </label>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Target Language Selector */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="target-language-home">Target Language</Label>
            <Select 
              value={currentUpload.targetLanguage} 
              onValueChange={(value) => dispatch(setTargetLanguage(value))}
            >
              <SelectTrigger id="target-language-home" className="w-full">
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
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Login required to complete the translation process
          </p>
        </Card>
      </motion.div>

      <div id="features" className="w-full max-w-6xl py-12">
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Key Features</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform offers powerful translation capabilities with advanced features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Multiple Language Support",
              description: "Translate your documents to and from a wide variety of languages with high accuracy."
            },
            {
              title: "Format Preservation",
              description: "Our system maintains the original document formatting throughout the translation process."
            },
            {
              title: "Fast Processing",
              description: "Get your translated documents quickly with our optimized processing pipeline."
            },
            {
              title: "Smart Duplication Detection",
              description: "Our checksum technology prevents duplicate translations, saving you time and resources."
            },
            {
              title: "Email Notifications",
              description: "Receive convenient email alerts when your translations are ready for download."
            },
            {
              title: "Secure Storage",
              description: "Your documents are safely stored with enterprise-grade security and encryption."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-glass rounded-xl p-6 transition-all duration-300 hover:shadow-md"
            >
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div variants={itemVariants} className="w-full max-w-3xl py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to translate your documents?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Get started today and experience the power of intelligent document translation.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/login">Create an Account</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Index;
