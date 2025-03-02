
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Enhanced type definitions for the translation process
export interface Translation {
  id: string;
  originalFileName: string;
  targetLanguage: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  createdAt: string;
  errorMessage?: string;
  processingDetails?: {
    engine: string;
    model: string;
    vectorStore: string;
    documentChunks: number;
    ragEnabled: boolean;
    processingTime?: number;
    totalTokens?: number;
    translationProvider?: string;
    agentEnabled?: boolean;
    confidenceScore?: number;
  };
}

interface TranslationState {
  translations: Translation[];
  currentUpload: {
    file: File | null;
    targetLanguage: string;
    status: "idle" | "uploading" | "success" | "error";
    error: string | null;
    progress?: number;
  };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TranslationState = {
  translations: [],
  currentUpload: {
    file: null,
    targetLanguage: "",
    status: "idle",
    error: null,
    progress: 0,
  },
  status: "idle",
  error: null,
};

// Update API endpoint URL based on environment
// In development, it will connect to localhost:5000
// In production, you would set this to your actual backend URL
const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:5000" 
  : "/api";

export const uploadDocument = createAsyncThunk(
  "translation/uploadDocument",
  async (
    { file, targetLanguage }: { file: File; targetLanguage: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetLanguage", targetLanguage);

      console.log(`Uploading document "${file.name}" for translation to ${targetLanguage}`);
      
      // Use the Python backend API
      const response = await fetch(`${API_BASE_URL}/api/translation/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to upload document");
      }

      const data = await response.json();
      console.log("Translation job created successfully:", data.translation);
      
      // Set up progress polling if the job is processing
      if (data.translation.status === "processing") {
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await fetch(`${API_BASE_URL}/api/translation/status/${data.translation.id}`);
            if (pollResponse.ok) {
              const pollData = await pollResponse.json();
              
              // Update progress
              dispatch(updateTranslationProgress({ 
                id: data.translation.id, 
                progress: pollData.progress || 0 
              }));
              
              // If completed or failed, stop polling
              if (pollData.status === "completed" || pollData.status === "failed") {
                clearInterval(pollInterval);
                
                // Refresh translations list to get the latest status
                dispatch(fetchTranslations());
              }
            }
          } catch (error) {
            console.error("Error polling translation status:", error);
          }
        }, 2000); // Poll every 2 seconds
      }
      
      return data.translation;
    } catch (error) {
      console.error("Upload document error:", error);
      return rejectWithValue("Network error: Could not upload document");
    }
  }
);

export const fetchTranslations = createAsyncThunk(
  "translation/fetchTranslations",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching translation history");
      const response = await fetch(`${API_BASE_URL}/api/translation/history`);

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch translations");
      }

      const data = await response.json();
      console.log(`Retrieved ${data.translations.length} translations from history`);
      return data.translations;
    } catch (error) {
      console.error("Fetch translations error:", error);
      return rejectWithValue("Network error: Could not fetch translations");
    }
  }
);

const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    setFile: (state, action: PayloadAction<File | null>) => {
      state.currentUpload.file = action.payload;
      state.currentUpload.status = "idle";
      state.currentUpload.error = null;
      state.currentUpload.progress = 0;
    },
    setTargetLanguage: (state, action: PayloadAction<string>) => {
      state.currentUpload.targetLanguage = action.payload;
    },
    clearUpload: (state) => {
      state.currentUpload = {
        file: null,
        targetLanguage: "",
        status: "idle",
        error: null,
        progress: 0,
      };
    },
    clearError: (state) => {
      state.error = null;
      state.status = "idle";
    },
    updateTranslationProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const { id, progress } = action.payload;
      const translation = state.translations.find(t => t.id === id);
      if (translation) {
        if (state.currentUpload.file && translation.originalFileName === state.currentUpload.file.name) {
          state.currentUpload.progress = progress;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.currentUpload.status = "uploading";
        state.currentUpload.error = null;
        state.currentUpload.progress = 0;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Translation>) => {
        state.currentUpload.status = "success";
        state.translations.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.currentUpload.status = "error";
        state.currentUpload.error = action.payload as string;
      })

      // Fetch Translations
      .addCase(fetchTranslations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTranslations.fulfilled, (state, action: PayloadAction<Translation[]>) => {
        state.status = "succeeded";
        state.translations = action.payload;
      })
      .addCase(fetchTranslations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setFile, setTargetLanguage, clearUpload, clearError, updateTranslationProgress } = translationSlice.actions;
export default translationSlice.reducer;
