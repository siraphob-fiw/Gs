import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTenantPreferences, clearError } from '../../store/slices/preferencesSlice';

export function usePreferences(tenantId?: string) {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);

  // Initialize preferences when tenantId is available
  useEffect(() => {
    if (tenantId && !preferences.isInitialized) {
      dispatch(fetchTenantPreferences({ tenantId }));
    }
  }, [tenantId, preferences.isInitialized, dispatch]);

  const clearPreferencesError = () => {
    dispatch(clearError());
  };

  return {
    language: preferences.language,
    availableLanguages: preferences.availableLanguages,
    isLoading: preferences.isLoading,
    error: preferences.error,
    isInitialized: preferences.isInitialized,
    clearError: clearPreferencesError,
  };
}
