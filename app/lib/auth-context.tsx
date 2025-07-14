'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  userRole: 'user' | 'admin' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, birthYear: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Kullanıcı yasaklanmış mı kontrol et
          if (userData.status === 'banned') {
            toast.error('Hesabınız yasaklanmıştır. Platform erişiminiz engellenmiştir.');
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
            return;
          }
          
          // Kullanıcı askıda mı kontrol et
          if (userData.status === 'suspended') {
            toast.error('Hesabınız askıya alınmıştır. Lütfen yöneticiyle iletişime geçin.');
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
            return;
          }
          
          // Son girişi güncelle (eğer son giriş 5 dakikadan eskiyse)
          const now = new Date();
          const lastLogin = userData.lastLoginAt?.toDate();
          if (!lastLogin || (now.getTime() - lastLogin.getTime()) > 5 * 60 * 1000) {
              await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          }

          // Firestore Timestamp'i Date'e dönüştür
          setUser({
            ...userData,
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
            interviewDate: userData.interviewDate?.toDate ? userData.interviewDate.toDate() : userData.interviewDate
          } as User);
        } else {
          // Eğer Firestore'da kullanıcı yoksa (Google ile ilk giriş), varsayılan değerlerle oluştur
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Kullanıcı',
            birthYear: null, // Google girişinde doğum yılı bilinmiyor
            isAdmin: false,
            createdAt: serverTimestamp(),
            likedPosts: [],
            savedPosts: []
          };

          // photoURL alanını sadece varsa ekle
          if (firebaseUser.photoURL) {
            newUser.photoURL = firebaseUser.photoURL;
          }

          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

          setUser({
            ...newUser,
            createdAt: new Date(),
            photoURL: firebaseUser.photoURL || undefined
          } as User);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    birthYear: number
  ) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Firebase Auth profilini güncelle
    await updateProfile(firebaseUser, { displayName });

    // Firestore'a kullanıcı bilgilerini kaydet
    const newUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      birthYear,
      isAdmin: false,
      createdAt: serverTimestamp(),
      likedPosts: [],
      savedPosts: []
    };

    // photoURL alanını sadece varsa ekle
    if (firebaseUser.photoURL) {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        photoURL: firebaseUser.photoURL
      });
    } else {
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    setUser(null); // Çıkış yapıldığında kullanıcı state'ini anında temizle
    await signOut(auth);
    router.push('/'); // Ana sayfaya yönlendir
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const userRole = user?.isAdmin ? 'admin' : user ? 'user' : null;
  
  const value = {
    user,
    firebaseUser,
    loading,
    userRole,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
