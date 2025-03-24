
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace these with your actual Firebase configuration values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloudinary configuration
// These would typically be provided by environment variables
export const cloudinaryConfig = {
  cloudName: "YOUR_CLOUD_NAME",  // Replace with your Cloudinary cloud name
  apiKey: "YOUR_CLOUDINARY_API_KEY",  // Replace with your Cloudinary API key
  uploadPreset: "user_profiles"  // This should be configured in your Cloudinary dashboard
};
