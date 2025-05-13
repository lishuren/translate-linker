
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { translationApi } from "../../services/translationApi";

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
  async ({ file, targetLanguage }: { file: File; targetLanguage: string }, thunkAPI) => {
    try {
      console.log("Uploading document:", file.name, "to language:", targetLanguage);
      // First make sure we're using the right API
      const response = await translationApi.uploadDocument(file, targetLanguage);
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
    updateTranslationStatus: (state, action: PayloadAction<{ id: string, status: TranslationStatus }>) => {
      const translation = state.translations.find(t => t.id === action.payload.id);
      if (translation) {
        translation.status = action.payload.status;
      }
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
    });
    builder.addCase(uploadDocument.rejected, (state, action) => {
      console.log("Upload rejected:", action.payload);
      state.currentUpload.status = "error";
      state.currentUpload.error = action.payload as string;
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
  }
});

export const { clearError, setFile, setTargetLanguage, clearUpload, updateTranslationStatus } = translationSlice.actions;

export default translationSlice.reducer;
