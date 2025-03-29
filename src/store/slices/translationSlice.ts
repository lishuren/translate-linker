
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as translationApi from "../../services/translationApi";

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
    llmProvider: string;
    userId?: string;
    status: "idle" | "uploading" | "success" | "error";
    error: string | null;
    progress?: number;
  };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  config: {
    isModelSelectionAllowed: boolean;
    checkedModelSelection: boolean;
    availableWebTranslationServices: string[];
  };
}

const initialState: TranslationState = {
  translations: [],
  currentUpload: {
    file: null,
    targetLanguage: "",
    llmProvider: "",
    userId: undefined,
    status: "idle",
    error: null,
    progress: 0,
  },
  status: "idle",
  error: null,
  config: {
    isModelSelectionAllowed: true, // Default to true for backward compatibility
    checkedModelSelection: false,
    availableWebTranslationServices: ["none"],
  }
};

/**
 * Checks if model selection is allowed for the current user
 */
export const checkModelSelectionPermission = createAsyncThunk(
  "translation/checkModelSelectionPermission",
  async (userId?: string, { rejectWithValue }) => {
    try {
      const isAllowed = await translationApi.isModelSelectionAllowed(userId);
      return { isAllowed, userId };
    } catch (error) {
      console.error("Check model selection permission error:", error);
      return rejectWithValue("Network error: Could not check model selection permission");
    }
  }
);

/**
 * Fetches available web translation services
 */
export const fetchWebTranslationServices = createAsyncThunk(
  "translation/fetchWebTranslationServices",
  async (_, { rejectWithValue }) => {
    try {
      const services = await translationApi.getAvailableWebTranslationServices();
      return { services };
    } catch (error) {
      console.error("Fetch web translation services error:", error);
      return rejectWithValue("Network error: Could not fetch web translation services");
    }
  }
);

/**
 * Uploads a document to the backend for translation
 * 
 * This thunk sends the file, target language, and LLM provider to the backend API,
 * which processes it using Langchain with the selected LLM provider
 */
export const uploadDocument = createAsyncThunk(
  "translation/uploadDocument",
  async (
    { 
      file, 
      targetLanguage, 
      llmProvider, 
      userId 
    }: { 
      file: File; 
      targetLanguage: string; 
      llmProvider?: string; 
      userId?: string;
    },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      console.log(`Uploading document "${file.name}" for translation to ${targetLanguage} using ${llmProvider || 'default'} LLM`);
      
      // Call the backend API endpoint through our service
      const data = await translationApi.uploadDocument(file, targetLanguage, llmProvider, userId);
      console.log("Translation job created successfully:", data.translation);
      
      // Set up progress polling if the job is processing
      if (data.translation.status === "processing") {
        const pollInterval = setInterval(async () => {
          try {
            const pollData = await translationApi.checkTranslationStatus(data.translation.id);
            
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

/**
 * Fetches the translation history from the backend API
 * 
 * This thunk retrieves all past translations for the current user
 */
export const fetchTranslations = createAsyncThunk(
  "translation/fetchTranslations",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching translation history");
      const data = await translationApi.fetchTranslationHistory();
      console.log(`Retrieved ${data.translations.length} translations from history`);
      return data.translations;
    } catch (error) {
      console.error("Fetch translations error:", error);
      return rejectWithValue("Network error: Could not fetch translations");
    }
  }
);

/**
 * Downloads a translated document from the backend API
 * 
 * This thunk initiates a file download for a completed translation
 */
export const downloadTranslation = createAsyncThunk(
  "translation/downloadTranslation",
  async (translationId: string, { rejectWithValue }) => {
    try {
      console.log(`Downloading translation ${translationId}`);
      
      // Initiate file download by redirecting to the download endpoint
      window.location.href = translationApi.getDownloadUrl(translationId);
      
      return { success: true };
    } catch (error) {
      console.error("Download translation error:", error);
      return rejectWithValue("Network error: Could not download translation");
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
    setLlmProvider: (state, action: PayloadAction<string>) => {
      state.currentUpload.llmProvider = action.payload;
    },
    setUserId: (state, action: PayloadAction<string | undefined>) => {
      state.currentUpload.userId = action.payload;
    },
    clearUpload: (state) => {
      state.currentUpload = {
        file: null,
        targetLanguage: "",
        llmProvider: "",
        userId: state.currentUpload.userId, // Preserve user ID
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
      // Check model selection permission
      .addCase(checkModelSelectionPermission.fulfilled, (state, action) => {
        state.config.isModelSelectionAllowed = action.payload.isAllowed;
        state.config.checkedModelSelection = true;
        // If user ID was provided, store it for future requests
        if (action.payload.userId) {
          state.currentUpload.userId = action.payload.userId;
        }
      })
      .addCase(checkModelSelectionPermission.rejected, (state) => {
        state.config.isModelSelectionAllowed = true; // Default to allowing selection
        state.config.checkedModelSelection = true;
      })
      
      // Fetch web translation services
      .addCase(fetchWebTranslationServices.fulfilled, (state, action) => {
        state.config.availableWebTranslationServices = action.payload.services;
      })
      .addCase(fetchWebTranslationServices.rejected, (state) => {
        state.config.availableWebTranslationServices = ["none"]; // Default if fetch fails
      })
      
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

export const { 
  setFile, 
  setTargetLanguage, 
  setLlmProvider,
  setUserId,
  clearUpload, 
  clearError, 
  updateTranslationProgress 
} = translationSlice.actions;

export default translationSlice.reducer;
