
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Export the User interface so it can be imported in other files
export interface User {
  email: string;
  isLoggedIn: boolean;
}

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// Async thunks
export const requestPassword = createAsyncThunk(
  "auth/requestPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch("/api/auth/request-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to request password");
      }
      
      return email;
    } catch (error) {
      return rejectWithValue("Network error: Could not request password");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to login");
      }
      
      const data = await response.json();
      return { email: credentials.email, isLoggedIn: true };
    } catch (error) {
      return rejectWithValue("Network error: Could not login");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // This will be replaced with actual API call
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to logout");
      }
      
      return null;
    } catch (error) {
      return rejectWithValue("Network error: Could not logout");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Request Password
      .addCase(requestPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(requestPassword.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = "succeeded";
      })
      .addCase(requestPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "succeeded";
        state.user = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
