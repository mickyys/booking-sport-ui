"use client";
import React, { createContext, useContext } from 'react';

const AdminPanelContext = createContext<any>(null);

export const AdminPanelProvider: React.FC<{ children?: React.ReactNode; value: any }> = ({ children, value }) => {
  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  );
};

export const useAdminPanelContext = () => {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error('useAdminPanelContext must be used within an AdminPanelProvider');
  }
  return context;
};
