import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setAppStateRef } from '@/services/socketService';

interface AppStateContextType {
  appState: AppStateStatus;
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  isInChat: (chatId: string) => boolean;
  isAppInForeground: () => boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const isInChat = useCallback((chatId: string): boolean => {
    return currentChatId === chatId;
  }, [currentChatId]);

  const isAppInForeground = useCallback((): boolean => {
    return appState === 'active';
  }, [appState]);

  const value: AppStateContextType = {
    appState,
    currentChatId,
    setCurrentChatId,
    isInChat,
    isAppInForeground,
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App state changed:', nextAppState);
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  }, []);

  // Set reference for socket service
  useEffect(() => {
    setAppStateRef({
      currentChatId,
      isAppInForeground,
      isInChat,
    });
  }, [currentChatId, isAppInForeground, isInChat]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
