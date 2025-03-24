
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Asset, AssetType } from '@/types/portfolio';

export interface NewAsset {
  name: string;
  type: AssetType;
  value: number;
  initialInvestment: number;
  purchaseDate?: string;
  notes?: string;
}

// Create a new asset for a user
export const addUserAsset = async (userId: string, asset: NewAsset) => {
  try {
    const returnsValue = asset.value - asset.initialInvestment;
    const returnsPercentage = (returnsValue / asset.initialInvestment) * 100;
    
    const assetData = {
      ...asset,
      id: '', // Will be populated by Firestore
      returnsPercentage,
      returns: returnsValue,
      growth: returnsValue > 0 ? 'positive' : returnsValue < 0 ? 'negative' : 'neutral',
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    
    const assetRef = collection(db, `users/${userId}/assets`);
    const docRef = await addDoc(assetRef, assetData);
    
    // Return the created asset with its ID
    return {
      ...assetData,
      id: docRef.id,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error adding asset:", error);
    throw error;
  }
};

// Get all assets for a user
export const getUserAssets = async (userId: string) => {
  try {
    const assetsRef = collection(db, `users/${userId}/assets`);
    const snapshot = await getDocs(assetsRef);
    
    return snapshot.docs.map(doc => ({
      ...(doc.data() as Asset),
      id: doc.id,
      lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error getting assets:", error);
    throw error;
  }
};

// Update an asset
export const updateUserAsset = async (userId: string, assetId: string, updates: Partial<Asset>) => {
  try {
    const assetRef = doc(db, `users/${userId}/assets`, assetId);
    await updateDoc(assetRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    throw error;
  }
};

// Delete an asset
export const deleteUserAsset = async (userId: string, assetId: string) => {
  try {
    const assetRef = doc(db, `users/${userId}/assets`, assetId);
    await deleteDoc(assetRef);
  } catch (error) {
    console.error("Error deleting asset:", error);
    throw error;
  }
};
