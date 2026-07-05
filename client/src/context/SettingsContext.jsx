import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings } from '../services/settings.service';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const { user } = useAuth();

  const loadSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSettings(res.data.data);
    } catch { /* settings not available yet */ }
  }, []);

  // Only fetch settings when authenticated — prevents 401 → refresh → redirect loop on the login page
  useEffect(() => {
    if (user) loadSettings();
    else setSettings(null);
  }, [user, loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, reloadSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
