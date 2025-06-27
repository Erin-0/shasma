import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // تسجيل مستخدم جديد
  const signup = async (email, password, displayName, age, profilePicture) => {
    try {
      // إنشاء حساب المصادقة
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // تحديث ملف المستخدم في المصادقة
          await updateProfile(user, {
            displayName,
            photoURL: profilePicture || '/default-avatar.png'
          });
    
          // إنشاء مستند المستخدم في Firestore
          await setDoc(doc(db, 'users', user.uid), {
            displayName,
            email,
            profilePicture: profilePicture || '/default-avatar.png',
            age,
            dragons: 0,
            emojis: [],
            followers: [],
            following: [],
            createdAt: serverTimestamp(),
            bio: `مرحباً، أنا ${displayName || 'مستخدم جديد'}! 👋`,
            postsCount: 0,
            isOnline: true,
            lastSeen: new Date()
          });
    
          toast.success('تم إنشاء الحساب بنجاح! 🎉');
          return user;
        } catch (error) {
          console.error('خطأ في إنشاء الحساب:', error);
    
          let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'كلمة المرور ضعيفة جداً';
          }
    
          toast.error(errorMessage);
          throw error;
        }
      };


  // تسجيل الدخول
  const login = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // تحقق من وجود المستند أولاً
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, {
        isOnline: true,
        lastSeen: new Date()
      });
    } else {
      // إذا لم يوجد، أنشئ المستند ببيانات أساسية
      await setDoc(userDocRef, {
        displayName: user.displayName || '',
        email: user.email,
        profilePicture: user.photoURL || '/default-avatar.png',
        dragons: 0,
        emojis: [],
        followers: [],
        following: [],
        createdAt: serverTimestamp(),
        bio: `مرحباً، أنا ${user.displayName || 'مستخدم جديد'}! 👋`,
        postsCount: 0,
        isOnline: true,
        lastSeen: new Date()
      });
    }

    toast.success('مرحباً بعودتك! 😊');
    return user;
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);

    let errorMessage = 'خطأ في تسجيل الدخول';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'هذا الحساب غير موجود';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'كلمة المرور غير صحيحة';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'محاولات كثيرة، حاول مرة أخرى لاحقاً';
    }

    toast.error(errorMessage);
    throw error;
  }
};

  // تسجيل الخروج
  const logout = async () => {
  try {
    if (currentUser) {
      // تحقق من وجود المستند أولاً
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          isOnline: false,
          lastSeen: new Date()
        });
      }
    }
      
      await signOut(auth);
      setUserProfile(null);
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
    }
  };

  // تحديث النقاط
  const updateDragons = async (points) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const newDragons = Math.max(0, userProfile.dragons + points);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        dragons: newDragons
      });
      
      setUserProfile(prev => ({
        ...prev,
        dragons: newDragons
      }));
      
      if (points > 0) {
        toast.success(`حصلت على ${points} دراغون! 🐉`);
      }
      
      return newDragons;
    } catch (error) {
      console.error('خطأ في تحديث النقاط:', error);
      return userProfile.dragons;
    }
  };

  // شراء إيموجي
  const buyEmoji = async (emojiData) => {
    if (!currentUser || !userProfile) return false;
    
    if (userProfile.dragons < emojiData.price) {
      toast.error('ليس لديك نقاط كافية! 💸');
      return false;
    }
    
    try {
      const newDragons = userProfile.dragons - emojiData.price;
      const newEmojis = [...userProfile.emojis, emojiData];
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        dragons: newDragons,
        emojis: newEmojis
      });
      
      setUserProfile(prev => ({
        ...prev,
        dragons: newDragons,
        emojis: newEmojis
      }));
      
      toast.success(`تم شراء ${emojiData.name} بنجاح! 🎉`);
      return true;
    } catch (error) {
      console.error('خطأ في شراء الإيموجي:', error);
      toast.error('حدث خطأ في عملية الشراء');
      return false;
    }
  };

  // تحديث الملف الشخصي
  const updateUserProfile = async (updates) => {
    if (!currentUser) return false;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      
      toast.success('تم تحديث الملف الشخصي بنجاح! ✅');
      return true;
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      toast.error('حدث خطأ في التحديث');
      return false;
    }
  };

  // جلب بيانات المستخدم من Firestore
  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        return userData;
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
    }
    return null;
  };

  // مراقبة حالة المصادقة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateDragons,
    buyEmoji,
    updateUserProfile,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
