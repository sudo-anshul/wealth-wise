
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace these with your actual Firebase configuration values
const firebaseConfig = {
  apiKey: "AIzaSyDs6Ipz-o8rzNWGqBHkBIZEJiJmlTDp_wo",

  authDomain: "wealth-wise-54.firebaseapp.com",

  projectId: "wealth-wise-54",

  storageBucket: "wealth-wise-54.firebasestorage.app",

  messagingSenderId: "836566642676",

  appId: "1:836566642676:web:e1e9129347ca7909cfd3a1",

  measurementId: "G-W943MRKDLB"

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
