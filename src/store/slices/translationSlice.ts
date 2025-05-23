
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { translationApi } from "../../services/translationApi";
import { toast } from "sonner";

export enum TranslationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}

export interface ProcessingDetails {
  engine: string;
  model: string;
  vectorStore: string;
  documentChunks: number;
  ragEnabled: boolean;
  processingTime: number | null;
  totalTokens: number | null;
  translationProvider: string | null;
  agentEnabled: boolean;
  confidenceScore: number | null;
}

export interface Translation {
  id: string;
  originalFileName: string;
  targetLanguage: string;
  status: TranslationStatus;
  downloadUrl?: string | null;
  createdAt: string;
  errorMessage?: string | null;
  processingDetails?: ProcessingDetails | null;
}

export interface CurrentUpload {
  file: File | null;
  targetLanguage: string;
  status: "idle" | "uploading" | "success" | "error";
  error: string | null;
}

export interface TranslationState {
  translations: Translation[];
  currentUpload: CurrentUpload;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}

const initialState: TranslationState = {
  translations: [],
  currentUpload: {
    file: null,
    targetLanguage: "",
    status: "idle",
    error: null
  },
  status: "idle",
  error: null
};

// Async thunks
export const uploadDocument = createAsyncThunk(
  "translation/uploadDocument",
  async ({ file, targetLanguage, llmProvider }: { file: File; targetLanguage: string; llmProvider?: string }, thunkAPI) => {
    try {
      console.log("Uploading document:", file.name, "to language:", targetLanguage, "using provider:", llmProvider || "default");
      
      // Check if any LLM providers are available
      const availableProviders = await translationApi.getAvailableLlmProviders();
      if (availableProviders.length === 0) {
        console.warn("No LLM providers available with API keys configured");
        toast.error("No LLM provider API keys configured. Please set up at least one provider.");
        return thunkAPI.rejectWithValue("No API keys configured. Please set up at least one LLM provider API key.");
      }
      
      // If the selected provider isn't available, use the first available one
      if (llmProvider && !availableProviders.includes(llmProvider)) {
        console.warn(`Selected provider ${llmProvider} is not available, using ${availableProviders[0]}`);
        llmProvider = availableProviders[0];
      }
      
      // First make sure we're using the right API
      const response = await translationApi.uploadDocument(file, targetLanguage, llmProvider);
      const translation = response.translation;
      
      console.log("Upload response:", translation);
      
      // Make sure status is properly handled
      return {
        ...translation,
        // Don't convert to enum yet, as we'll handle that in the reducer
        status: translation.status 
      } as Translation;
    } catch (error: any) {
      console.error("Upload error in thunk:", error);
      toast.error(error.message || "Failed to upload document");
      return thunkAPI.rejectWithValue(error.message || "Failed to upload document");
    }
  }
);

export const fetchTranslations = createAsyncThunk(
  "translation/fetchAll", 
  async (_, thunkAPI) => {
    try {
      console.log("Fetching translations");
      const response = await translationApi.fetchTranslationHistory();
      const translations = response.translations;
      
      console.log("Fetched translations:", translations);
      
      // Don't force status to enum conversion here, handle in reducer
      return translations.map(t => ({
        ...t
      })) as Translation[];
    } catch (error: any) {
      console.error("Fetch error in thunk:", error);
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch translations");
    }
  }
);

export const deleteTranslation = createAsyncThunk(
  "translation/delete",
  async (translationId: string, thunkAPI) => {
    try {
      console.log("Deleting translation:", translationId);
      await translationApi.deleteTranslation(translationId);
      
      toast.success("Translation deleted successfully");
      return translationId;
    } catch (error: any) {
      console.error("Delete error in thunk:", error);
      toast.error(error.message || "Failed to delete translation");
      return thunkAPI.rejectWithValue(error.message || "Failed to delete translation");
    }
  }
);

const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFile: (state, action: PayloadAction<File | null>) => {
      state.currentUpload.file = action.payload;
      if (!action.payload) {
        state.currentUpload.status = "idle";
        state.currentUpload.error = null;
      }
    },
    setTargetLanguage: (state, action: PayloadAction<string>) => {
      state.currentUpload.targetLanguage = action.payload;
    },
    clearUpload: (state) => {
      state.currentUpload = initialState.currentUpload;
    },
    updateTranslationStatus: (state, action: PayloadAction<{ id: string, status: TranslationStatus, errorMessage?: string }>) => {
      const translation = state.translations.find(t => t.id === action.payload.id);
      if (translation) {
        translation.status = action.payload.status;
        if (action.payload.errorMessage) {
          translation.errorMessage = action.payload.errorMessage;
        }
      }
    },
    addTranslation(state, action: PayloadAction<Translation>) {
      state.translations.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    // Upload document
    builder.addCase(uploadDocument.pending, (state) => {
      state.currentUpload.status = "uploading";
      state.error = null;
      console.log("Upload pending");
    });
    builder.addCase(uploadDocument.fulfilled, (state, action) => {
      console.log("Upload fulfilled:", action.payload);
      state.currentUpload.status = "success";
      
      // Add the new translation to the beginning of the array for immediate visibility
      // Ensure the status is properly handled
      const newTranslation = {
        ...action.payload,
        status: action.payload.status // Keep the status from the server
      };
      state.translations.unshift(newTranslation);
      
      // Show success toast
      toast.success(`Document uploaded successfully. Translation in progress.`);
    });
    builder.addCase(uploadDocument.rejected, (state, action) => {
      console.log("Upload rejected:", action.payload);
      state.currentUpload.status = "error";
      state.currentUpload.error = action.payload as string;
      
      // Show error toast
      toast.error(action.payload as string || "Unknown error during upload");
    });
    
    // Fetch all translations
    builder.addCase(fetchTranslations.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchTranslations.fulfilled, (state, action) => {
      state.status = "success";
      
      // Ensure statuses are properly mapped
      state.translations = action.payload.map(translation => ({
        ...translation,
        status: translation.status // Keep the status from the server
      }));
    });
    builder.addCase(fetchTranslations.rejected, (state, action) => {
      state.status = "error";
      state.error = action.payload as string;
    });
    
    // Delete translation
    builder.addCase(deleteTranslation.fulfilled, (state, action) => {
      // Remove the deleted translation from the array
      state.translations = state.translations.filter(t => t.id !== action.payload);
    });
  }
});

export const { clearError, setFile, setTargetLanguage, clearUpload, updateTranslationStatus, addTranslation } = translationSlice.actions;

export default translationSlice.reducer;
