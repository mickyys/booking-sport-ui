"use client";
import React from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';

export const SuperAdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8 lg:overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
