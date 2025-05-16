
import { useState } from "react";
import { FileUpload, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import config from "@/config/environment";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface TMXEntry {
  id: string;
  filename: string;
  units_parsed: number;
  total_units: number;
  created_at: string;
}

const TmxManager = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tmxEntries, setTmxEntries] = useState<TMXEntry[]>([]);
  const [uploadResult, setUploadResult] = useState<TMXUploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.tmx')) {
        toast({
          title: "Invalid File Format",
          description: "Please select a valid TMX file (.tmx extension)",
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
        title: "No File Selected",
        description: "Please select a TMX file to upload",
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
      
      // Add the new entry to the list
      if (response.data.success) {
        const newEntry: TMXEntry = {
          id: response.data.tmx_id,
          filename: response.data.result.filename,
          units_parsed: response.data.result.units_parsed,
          total_units: response.data.result.total_units_in_memory,
          created_at: new Date().toISOString()
        };
        
        setTmxEntries(prev => [newEntry, ...prev]);
        
        toast({
          title: "TMX File Uploaded Successfully",
          description: `${response.data.result.units_parsed} translation units processed`,
        });
      }
      
      setFile(null);
    } catch (error: any) {
      console.error("Error uploading TMX file:", error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload TMX file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Upload TMX File Card */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Upload Translation Memory (TMX)</CardTitle>
            <CardDescription>
              Add translation memory files to improve translation quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tmx-file">Select TMX File</Label>
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
                      <>Uploading...</>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload TMX files to enhance translation accuracy with your existing translation memory
                </p>
              </div>

              {file && (
                <div className="rounded-md bg-secondary p-3">
                  <div className="flex items-center space-x-3">
                    <FileUpload className="h-5 w-5 text-primary" />
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
                  <AlertTitle>TMX File Uploaded Successfully</AlertTitle>
                  <AlertDescription>
                    <ul className="text-sm list-disc pl-5 mt-2">
                      <li>Filename: {uploadResult.result.filename}</li>
                      <li>Units Parsed: {uploadResult.result.units_parsed}</li>
                      <li>New Units: {uploadResult.result.units_new}</li>
                      <li>Updated Units: {uploadResult.result.units_updated}</li>
                      <li>Total Translation Units: {uploadResult.result.total_units_in_memory}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* TMX Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Memory Library</CardTitle>
          <CardDescription>
            Translation memory files that will be used for RAG-enhanced translations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tmxEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Total Units</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tmxEntries.map((entry) => (
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
              <FileUpload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No TMX files uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload TMX files to enhance translation quality with your existing translation memory
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TmxManager;
