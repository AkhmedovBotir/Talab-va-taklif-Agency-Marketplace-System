import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from '../services/api';

interface LocationContextType {
  selectedViloyat: Region | null;
  selectedTuman: Region | null;
  setSelectedViloyat: (viloyat: Region | null) => void;
  setSelectedTuman: (tuman: Region | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const VILOYAT_KEY = '@marketplace:selectedViloyat';
const TUMAN_KEY = '@marketplace:selectedTuman';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedViloyat, setSelectedViloyatState] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTumanState] = useState<Region | null>(null);

  // Load saved location on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedViloyat = await AsyncStorage.getItem(VILOYAT_KEY);
        const savedTuman = await AsyncStorage.getItem(TUMAN_KEY);
        
        if (savedViloyat) {
          setSelectedViloyatState(JSON.parse(savedViloyat));
        }
        if (savedTuman) {
          setSelectedTumanState(JSON.parse(savedTuman));
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      }
    };

    loadSavedLocation();
  }, []);

  const setSelectedViloyat = async (viloyat: Region | null) => {
    setSelectedViloyatState(viloyat);
    if (viloyat) {
      await AsyncStorage.setItem(VILOYAT_KEY, JSON.stringify(viloyat));
    } else {
      await AsyncStorage.removeItem(VILOYAT_KEY);
    }
    // Clear tuman when viloyat changes
    if (viloyat) {
      setSelectedTumanState(null);
      await AsyncStorage.removeItem(TUMAN_KEY);
    }
  };

  const setSelectedTuman = async (tuman: Region | null) => {
    setSelectedTumanState(tuman);
    if (tuman) {
      await AsyncStorage.setItem(TUMAN_KEY, JSON.stringify(tuman));
    } else {
      await AsyncStorage.removeItem(TUMAN_KEY);
    }
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

