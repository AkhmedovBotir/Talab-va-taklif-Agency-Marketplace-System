import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Region } from '../services/api';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
  selectedViloyat: Region | null;
  selectedTuman: Region | null;
  setSelectedViloyat: (viloyat: Region | null) => void;
  setSelectedTuman: (tuman: Region | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [selectedViloyat, setSelectedViloyatState] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTumanState] = useState<Region | null>(null);
  const [hasLoadedFromAPI, setHasLoadedFromAPI] = useState(false);

  // Load location from API only (no localStorage)
  useEffect(() => {
    const loadLocationFromAPI = async () => {
      if (!isAuthenticated || !token) {
        // Clear location if not authenticated
        setSelectedViloyatState(null);
        setSelectedTumanState(null);
        setHasLoadedFromAPI(false);
        return;
      }

      if (hasLoadedFromAPI) {
        return;
      }

      try {
        const response = await apiService.getViloyatTuman(token);
        
        console.log('LocationContext: GET /api/marketplace/me/viloyat-tuman Response:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          // Update location from API response only
          if (response.data.viloyat && typeof response.data.viloyat === 'object') {
            setSelectedViloyatState(response.data.viloyat);
            console.log('LocationContext: Loaded viloyat from API:', response.data.viloyat._id, response.data.viloyat.name);
          } else {
            setSelectedViloyatState(null);
            console.log('LocationContext: Cleared viloyat (API returned null)');
        }
          
          if (response.data.tuman && typeof response.data.tuman === 'object') {
            setSelectedTumanState(response.data.tuman);
            console.log('LocationContext: Loaded tuman from API:', response.data.tuman._id, response.data.tuman.name);
          } else {
            setSelectedTumanState(null);
            console.log('LocationContext: Cleared tuman (API returned null)');
          }
          
          setHasLoadedFromAPI(true);
        }
      } catch (error: any) {
        // Don't log 401 errors - they're handled by API service
        if (error?.status !== 401) {
          console.error('Error loading location from API:', error);
        }
        setHasLoadedFromAPI(true);
      }
    };

    loadLocationFromAPI();
  }, [isAuthenticated, token, hasLoadedFromAPI]);

  // Reset hasLoadedFromAPI when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setHasLoadedFromAPI(false);
      setSelectedViloyatState(null);
      setSelectedTumanState(null);
    }
  }, [isAuthenticated]);

  const setSelectedViloyat = async (viloyat: Region | null) => {
    console.log('LocationContext.setSelectedViloyat called:', viloyat?._id || 'null', viloyat?.name || 'null');
    const currentViloyatId = selectedViloyat?._id;
    const newViloyatId = viloyat?._id;
    
    setSelectedViloyatState(viloyat);
    // Clear tuman only when viloyat actually changes (not when same viloyat is set again)
    if (viloyat && currentViloyatId !== newViloyatId) {
      console.log('LocationContext: Viloyat changed, clearing tuman');
      setSelectedTumanState(null);
    }
  };

  const setSelectedTuman = async (tuman: Region | null) => {
    console.log('LocationContext.setSelectedTuman called:', tuman?._id || 'null', tuman?.name || 'null');
    setSelectedTumanState(tuman);
  };

  return (
    <LocationContext.Provider
      value={{
        selectedViloyat,
        selectedTuman,
        setSelectedViloyat,
        setSelectedTuman,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

