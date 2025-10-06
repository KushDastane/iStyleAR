import { db } from '../firebase/config';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export const addToWardrobe = async (userId, item) => {
  try {
    await addDoc(collection(db, 'users', userId, 'wardrobe'), {
      name: item.name,
      imageUrl: item.imageUrl,
      addedAt: serverTimestamp(),
      source: 'dashboard',
      favorite: false,
    });
  } catch (error) {
    console.error('Error adding to wardrobe:', error);
    throw error;
  }
};

export const getWardrobeItems = async (userId) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'wardrobe'));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error('Error getting wardrobe items:', error);
    throw error;
  }
};
