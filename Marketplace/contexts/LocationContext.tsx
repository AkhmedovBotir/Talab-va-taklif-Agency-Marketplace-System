import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Region } from '../services/api';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
  selectedViloyat: Region | null;
  selectedTuman: Region | null;
  selectedMfy: Region | null;
  setSelectedViloyat: (viloyat: Region | null) => void;
  setSelectedTuman: (tuman: Region | null) => void;
  setSelectedMfy: (mfy: Region | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [selectedViloyat, setSelectedViloyatState] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTumanState] = useState<Region | null>(null);
  const [selectedMfy, setSelectedMfyState] = useState<Region | null>(null);
  const [hasLoadedFromAPI, setHasLoadedFromAPI] = useState(false);

  // Load location from API only (no localStorage)
  useEffect(() => {
    const loadLocationFromAPI = async () => {
      if (!isAuthenticated || !token) {
        // Clear location if not authenticated
        setSelectedViloyatState(null);
        setSelectedTumanState(null);
        setSelectedMfyState(null);
        setHasLoadedFromAPI(false);
        return;
      }

      if (hasLoadedFromAPI) {
        return;
      }

      try {
        const response = await apiService.getViloyatTuman(token);
        
        
        if (response.success && response.data) {
          // Update location from API response only
          if (response.data.viloyat && typeof response.data.viloyat === 'object') {
            setSelectedViloyatState(response.data.viloyat);
          } else {
            setSelectedViloyatState(null);
          }
          
          if (response.data.tuman && typeof response.data.tuman === 'object') {
            setSelectedTumanState(response.data.tuman);
          } else {
            setSelectedTumanState(null);
          }
          
          if (response.data.mfy && typeof response.data.mfy === 'object') {
            setSelectedMfyState(response.data.mfy);
          } else {
            setSelectedMfyState(null);
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
      setSelectedMfyState(null);
    }
  }, [isAuthenticated]);

  const setSelectedViloyat = async (viloyat: Region | null) => {
    const currentViloyatId = selectedViloyat?._id;
    const newViloyatId = viloyat?._id;
    
    setSelectedViloyatState(viloyat);
    // Clear tuman and mfy when viloyat changes (not when same viloyat is set again)
    if (viloyat && currentViloyatId !== newViloyatId) {
      setSelectedTumanState(null);
      setSelectedMfyState(null);
    } else if (!viloyat) {
      // If viloyat is cleared, clear tuman and mfy
      setSelectedTumanState(null);
      setSelectedMfyState(null);
    }
  };

  const setSelectedTuman = async (tuman: Region | null) => {
    const currentTumanId = selectedTuman?._id;
    const newTumanId = tuman?._id;
    
    setSelectedTumanState(tuman);
    // Clear mfy when tuman changes (not when same tuman is set again)
    if (tuman && currentTumanId !== newTumanId) {
      setSelectedMfyState(null);
    } else if (!tuman) {
      // If tuman is cleared, clear mfy
      setSelectedMfyState(null);
    }
  };

  const setSelectedMfy = async (mfy: Region | null) => {
    setSelectedMfyState(mfy);
  };

  return (
    <LocationContext.Provider
      value={{
        selectedViloyat,
        selectedTuman,
        selectedMfy,
        setSelectedViloyat,
        setSelectedTuman,
        setSelectedMfy,
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

