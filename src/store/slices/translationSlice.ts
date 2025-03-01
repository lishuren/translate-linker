
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Translation {
  id: string;
  originalFileName: string;
  targetLanguage: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  createdAt: string;
}

interface TranslationState {
  translations: Translation[];
  currentUpload: {
    file: File | null;
    targetLanguage: string;
    status: "idle" | "uploading" | "success" | "error";
    error: string | null;
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
  },
  status: "idle",
  error: null,
};

export const uploadDocument = createAsyncThunk(
  "translation/uploadDocument",
  async (
    { file, targetLanguage }: { file: File; targetLanguage: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetLanguage", targetLanguage);

      // This will be replaced with actual API call
      const response = await fetch("/api/translation/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to upload document");
      }

      const data = await response.json();
      return data.translation;
    } catch (error) {
      return rejectWithValue("Network error: Could not upload document");
    }
  }
);

export const fetchTranslations = createAsyncThunk(
  "translation/fetchTranslations",
  async (_, { rejectWithValue }) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch("/api/translation/history");

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch translations");
      }

      const data = await response.json();
      return data.translations;
    } catch (error) {
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
      };
    },
    clearError: (state) => {
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.currentUpload.status = "uploading";
        state.currentUpload.error = null;
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

export const { setFile, setTargetLanguage, clearUpload, clearError } = translationSlice.actions;
export default translationSlice.reducer;
