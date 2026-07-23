import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { auth, db } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const createUserDocument = async (user, additionalData = {}) => {
    const userReference = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userReference);

    if (userSnapshot.exists()) {
      return;
    }

    await setDoc(userReference, {
      uid: user.uid,
      username:
        additionalData.username ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Giocatore",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider:
        additionalData.provider ||
        user.providerData?.[0]?.providerId ||
        "password",
      createdAt: serverTimestamp(),
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
    });
  };

  const register = async ({ username, email, password }) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await updateProfile(credential.user, {
      displayName: username,
    });

    await createUserDocument(credential.user, {
      username,
      provider: "password",
    });

    setCurrentUser({
      ...credential.user,
      displayName: username,
    });

    return credential.user;
  };

  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    return credential.user;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);

    await createUserDocument(credential.user, {
      provider: "google.com",
    });

    return credential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          await createUserDocument(user);
        }

        setCurrentUser(user);
      } catch (error) {
        console.error("Errore durante il caricamento dell'utente:", error);

        setCurrentUser(user);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const contextValue = useMemo(
    () => ({
      currentUser,
      authLoading,
      isAuthenticated: Boolean(currentUser),
      register,
      login,
      loginWithGoogle,
      logout,
    }),
    [currentUser, authLoading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve essere utilizzato dentro AuthProvider.");
  }

  return context;
}
