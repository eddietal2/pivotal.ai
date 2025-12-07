'use client';
import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <UIContext.Provider value={{ modalOpen, setModalOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
