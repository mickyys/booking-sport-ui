"use client";
import React, { createContext, useContext } from 'react';

interface ViewAsCenterValue {
  centerId: string | null;
  /** Prefijo de las rutas del panel: '/admin' o la vista del superadmin. */
  basePath: string;
}

const ViewAsCenterContext = createContext<ViewAsCenterValue>({ centerId: null, basePath: '/admin' });

export const ViewAsCenterProvider = ViewAsCenterContext.Provider;

export const useViewAsCenter = () => useContext(ViewAsCenterContext);

/** Devuelve la ruta del panel respetando la vista del superadmin. */
export const useAdminPath = () => {
  const { basePath } = useViewAsCenter();
  return (sub: string = '') => `${basePath}${sub}`;
};
