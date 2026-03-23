import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Region } from '../services/api';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
  selectedViloyat: Region | null;
  selectedTuman: Region | null;
  selectedMfy: Region | null;
  setSelectedViloyat: (v: Region | null) => void;
  setSelectedTuman: (t: Region | null) => void;
  setSelectedMfy: (m: Region | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [selectedViloyat, setSelectedViloyatState] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTumanState] = useState<Region | null>(null);
  const [selectedMfy, setSelectedMfyState] = useState<Region | null>(null);
  const [hasLoadedFromAPI, setHasLoadedFromAPI] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSelectedViloyatState(null);
      setSelectedTumanState(null);
      setSelectedMfyState(null);
      setHasLoadedFromAPI(false);
      return;
    }
    if (hasLoadedFromAPI) return;
    const load = async () => {
      try {
        const res = await apiService.getViloyatTuman(token);
        if (res.success && res.data) {
          setSelectedViloyatState(
            res.data.viloyat && typeof res.data.viloyat === 'object' ? res.data.viloyat : null
          );
          setSelectedTumanState(
            res.data.tuman && typeof res.data.tuman === 'object' ? res.data.tuman : null
          );
          setSelectedMfyState(
            res.data.mfy && typeof res.data.mfy === 'object' ? res.data.mfy : null
          );
        }
        setHasLoadedFromAPI(true);
      } catch (e) {
        setHasLoadedFromAPI(true);
      }
    };
    load();
  }, [isAuthenticated, token, hasLoadedFromAPI]);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasLoadedFromAPI(false);
      setSelectedViloyatState(null);
      setSelectedTumanState(null);
      setSelectedMfyState(null);
    }
  }, [isAuthenticated]);

  const setSelectedViloyat = (v: Region | null) => {
    setSelectedViloyatState(v);
    if (!v || v._id !== selectedViloyat?._id) {
      setSelectedTumanState(null);
      setSelectedMfyState(null);
    }
  };

  const setSelectedTuman = (t: Region | null) => {
    setSelectedTumanState(t);
    if (!t || t._id !== selectedTuman?._id) setSelectedMfyState(null);
  };

  const setSelectedMfy = (m: Region | null) => {
    setSelectedMfyState(m);
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
  const ctx = useContext(LocationContext);
  if (ctx === undefined) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
