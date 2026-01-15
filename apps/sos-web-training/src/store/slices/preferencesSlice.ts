import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { proxyClient } from '@/lib/proxy-client';

export interface PreferencesState {
  language: string;
  availableLanguages: string[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: PreferencesState = {
  language: 'en',
  availableLanguages: ['en', 'th'],
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunk to fetch tenant preferences
export const fetchTenantPreferences = createAsyncThunk(
  'preferences/fetchTenantPreferences',
  async ({ tenantId }: { tenantId: string }, { rejectWithValue }) => {
    try {
      const res = await proxyClient.get<{
        defaultLanguage?: string;
        availableLanguages?: string[];
      }>(`/tenants/${tenantId}/util`);

      return {
        language: res.defaultLanguage ?? 'en',
        availableLanguages: res.availableLanguages ?? ['en', 'th'],
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);
const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setAvailableLanguages: (state, action: PayloadAction<string[]>) => {
      state.availableLanguages = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tenant preferences
      .addCase(fetchTenantPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.language = action.payload.language;
        state.availableLanguages = action.payload.availableLanguages;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchTenantPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });
  },
});

export const { setLanguage, setAvailableLanguages, clearError } =
  preferencesSlice.actions;

export default preferencesSlice.reducer;
