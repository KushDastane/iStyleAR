import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "./AuthContext";
import { addToWardrobe as addToWardrobeService, getWardrobeItems } from '../services/wardrobeService';

const WardrobeContext = createContext();

export const WardrobeProvider = ({ children }) => {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWardrobeItems();
    }
  }, [user]);

  const loadWardrobeItems = async () => {
    setLoading(true);
    try {
      const items = await getWardrobeItems(user.uid);
      setWardrobeItems(items);
    } catch (error) {
      console.error('Error loading wardrobe items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWardrobe = async (item) => {
    if (!user) return;
    try {
      await addToWardrobeService(user.uid, item);
      // Reload items to reflect the change
      await loadWardrobeItems();
    } catch (error) {
      console.error('Error adding to wardrobe:', error);
      throw error;
    }
  };

  return (
    <WardrobeContext.Provider value={{ wardrobeItems, loading, addToWardrobe }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
