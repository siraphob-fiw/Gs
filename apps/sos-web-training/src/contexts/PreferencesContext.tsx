'use client';

import React, { createContext, useContext } from 'react';
import { usePreferences } from '../hooks/api/use-preferences';
import { useAuth } from './auth-context';
import { WeightUnit } from '@strengthos/shared-types';

interface PreferencesContextType {
  language: string;
  availableLanguages: string[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { state } = useAuth();
  const user = state.user;
  const preferences = usePreferences(user?.tenantId);

  const contextValue: PreferencesContextType = {
    language: preferences.language,
    availableLanguages: preferences.availableLanguages,
    isLoading: preferences.isLoading,
    error: preferences.error,
    clearError: preferences.clearError,
  };

  return <PreferencesContext.Provider value={contextValue}>{children}</PreferencesContext.Provider>;
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferencesContext must be used within a PreferencesProvider');
  }
  return context;
}
