
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  birthdate?: string;
  occupation?: string;
  interests?: string;
  profilePictureUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        console.log("No user profile found");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const createUserProfile = async (user: User, displayName: string) => {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Add timestamp for update
      const updatedData = {
        ...updates,
        updatedAt: Date.now()
      };
      
      await updateDoc(userDocRef, updatedData);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updatedData } : null);
      
      // Update displayName in Firebase Auth if it's being updated
      if (updates.displayName && user) {
        await updateProfile(user, { displayName: updates.displayName });
      }
      
      toast.success("Profile updated successfully");
      return;
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      // These values would be provided by your environment variables or settings
      const cloudName = "YOUR_CLOUD_NAME"; // Replace with your Cloudinary cloud name
      const uploadPreset = "user_profiles"; // This should be configured in your Cloudinary dashboard
      
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      // Make the upload request to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      const imageUrl = data.secure_url;
      
      // Update the user profile with the new image URL
      await updateUserProfile({ profilePictureUrl: imageUrl });
      
      toast.success("Profile picture updated successfully");
      return imageUrl;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture");
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user, displayName);
      toast.success("Account created successfully");
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error("Failed to create account");
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Failed to log in");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signup, 
      login, 
      logout, 
      updateUserProfile,
      uploadProfilePicture 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
