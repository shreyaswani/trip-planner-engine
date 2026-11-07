import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const useAuthStore = create((set) => ({
  user: null,         // Holds Firebase user object (uid, phoneNumber)
  isLoading: true,    // True when checking if user is logged in
  
  // This function listens to Firebase. If a user logs in or out, it updates the global app state instantly.
  initializeAuthListener: () => {
    onAuthStateChanged(auth, (currentUser) => {
      set({ user: currentUser, isLoading: false });
    });
  },

  // Helper to log out from anywhere in the app
  logout: async () => {
    await auth.signOut();
    set({ user: null });
  }
}));

export default useAuthStore;