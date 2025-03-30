
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

interface TranslationState {
  translations: Translation[];
  activeTranslation: Translation | null;
  isLoading: boolean;
  error: string | null;
  modelSelectionAllowed: boolean;
  availableWebTranslations: string[];
  systemInfo: any;
}

const initialState: TranslationState = {
  translations: [],
  activeTranslation: null,
  isLoading: false,
  error: null,
  modelSelectionAllowed: true,
  availableWebTranslations: [],
  systemInfo: null
};

// Async thunks
export const uploadDocument = createAsyncThunk(
  "translation/uploadDocument",
  async ({ file, targetLanguage, llmProvider }: { file: File; targetLanguage: string; llmProvider?: string }, thunkAPI) => {
    try {
      const translation = await translationApi.uploadDocument(file, targetLanguage, llmProvider);
      return translation;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const checkTranslationStatus = createAsyncThunk(
  "translation/checkStatus",
  async (translationId: string, thunkAPI) => {
    try {
      const status = await translationApi.checkStatus(translationId);
      return status;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchTranslations = createAsyncThunk(
  "translation/fetchAll", 
  async (_, thunkAPI) => {
    try {
      const translations = await translationApi.fetchTranslations();
      return translations;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const downloadTranslation = createAsyncThunk(
  "translation/download",
  async (translationId: string, thunkAPI) => {
    try {
      await translationApi.downloadTranslation(translationId);
      return translationId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const checkModelSelectionPermission = createAsyncThunk(
  "translation/modelSelectionPermission",
  async (_, thunkAPI) => {
    try {
      const allowed = await translationApi.getModelSelectionPermission();
      return allowed;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchWebTranslationServices = createAsyncThunk(
  "translation/webTranslationServices",
  async (_, thunkAPI) => {
    try {
      const services = await translationApi.getAvailableWebTranslationServices();
      return services;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchSystemInfo = createAsyncThunk(
  "translation/systemInfo",
  async (_, thunkAPI) => {
    try {
      const info = await translationApi.getSystemInfo();
      return info;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
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
    setActiveTranslation: (state, action: PayloadAction<Translation | null>) => {
      state.activeTranslation = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Upload document
    builder.addCase(uploadDocument.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Translation>) => {
      state.isLoading = false;
      state.activeTranslation = action.payload;
      state.translations.push(action.payload);
    });
    builder.addCase(uploadDocument.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Check translation status
    builder.addCase(checkTranslationStatus.fulfilled, (state, action) => {
      const { id, status, progress, downloadUrl, errorMessage } = action.payload;
      
      // Update the translation in the list
      const translationIndex = state.translations.findIndex(t => t.id === id);
      if (translationIndex !== -1) {
        state.translations[translationIndex] = {
          ...state.translations[translationIndex],
          status,
          downloadUrl: downloadUrl || state.translations[translationIndex].downloadUrl,
          errorMessage: errorMessage || state.translations[translationIndex].errorMessage
        };
      }
      
      // Update active translation if it's the one being checked
      if (state.activeTranslation && state.activeTranslation.id === id) {
        state.activeTranslation = {
          ...state.activeTranslation,
          status,
          downloadUrl: downloadUrl || state.activeTranslation.downloadUrl,
          errorMessage: errorMessage || state.activeTranslation.errorMessage
        };
      }
    });
    
    // Fetch all translations
    builder.addCase(fetchTranslations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTranslations.fulfilled, (state, action: PayloadAction<Translation[]>) => {
      state.isLoading = false;
      state.translations = action.payload;
    });
    builder.addCase(fetchTranslations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Model selection permission
    builder.addCase(checkModelSelectionPermission.fulfilled, (state, action) => {
      state.modelSelectionAllowed = action.payload;
    });
    
    // Web translation services
    builder.addCase(fetchWebTranslationServices.fulfilled, (state, action) => {
      state.availableWebTranslations = action.payload;
    });
    
    // System info
    builder.addCase(fetchSystemInfo.fulfilled, (state, action) => {
      state.systemInfo = action.payload;
    });
  }
});

export const { clearError, setActiveTranslation } = translationSlice.actions;

export default translationSlice.reducer;
