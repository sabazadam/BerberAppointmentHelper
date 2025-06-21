import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from a test collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Firebase read test successful, documents:', snapshot.size);
    
    // Try to write to a test collection
    const testDoc = await addDoc(testCollection, {
      test: true,
      timestamp: new Date(),
      message: 'Firebase connection test'
    });
    console.log('Firebase write test successful, document ID:', testDoc.id);
    
    return { success: true, message: 'Firebase connection working' };
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    return { 
      success: false, 
      message: `Firebase connection failed: ${error.message}`,
      code: error.code 
    };
  }
};