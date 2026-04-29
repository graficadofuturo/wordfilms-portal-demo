import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { DEFAULT_SITE_DATA, SiteData } from './types';

import { getStorage } from 'firebase/storage';

const isRemixed = firebaseConfig.projectId === 'remixed-project-id';

const app = !isRemixed ? initializeApp(firebaseConfig) : null as any;
export const auth = !isRemixed ? getAuth(app) : { currentUser: null, onAuthStateChanged: () => () => {} } as any;
export const db = !isRemixed ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null as any;
export const googleProvider = !isRemixed ? new GoogleAuthProvider() : null as any;
export const storage = !isRemixed ? getStorage(app) : null as any;

export const loginWithGoogle = () => !isRemixed ? signInWithPopup(auth, googleProvider) : Promise.resolve();
export const logout = () => !isRemixed ? signOut(auth) : Promise.resolve();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to initialize site data if it doesn't exist
export const initializeSiteData = async () => {
  if (isRemixed) return;
  const siteDoc = doc(db, 'site', 'config');
  
  // Test connection first as per guidelines
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }

  try {
    const snapshot = await getDoc(siteDoc);
    if (!snapshot.exists()) {
      // Only attempt to write if we are the admin
      if (auth.currentUser?.email === "graficadfuturo@gmail.com") {
        await setDoc(siteDoc, DEFAULT_SITE_DATA);
      }
    }
  } catch (error) {
    // If it's a permission error during initialization, we can often ignore it for non-admins
    // but we should log it properly if it's unexpected.
    const isPermissionError = error instanceof Error && error.message.includes('permission');
    if (!isPermissionError) {
      handleFirestoreError(error, OperationType.GET, 'site/config');
    }
  }
};

export const updateSiteData = async (data: SiteData) => {
  if (isRemixed) {
    console.log("Mock updateSiteData", data);
    return;
  }
  const path = 'site/config';
  try {
    const siteDoc = doc(db, 'site', 'config');
    await setDoc(siteDoc, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToSiteData = (callback: (data: SiteData) => void) => {
  if (isRemixed) {
    const mergedData = { ...DEFAULT_SITE_DATA };
    callback(mergedData);
    return () => {};
  }
  const path = 'site/config';
  const siteDoc = doc(db, 'site', 'config');
  return onSnapshot(siteDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as SiteData;
      
      // Ensure missing features like clients are populated from defaults
      const mergedData = { ...data };
      if (!mergedData.clients || mergedData.clients.length === 0) {
        mergedData.clients = DEFAULT_SITE_DATA.clients;
      }
      
      if (!mergedData.numbers || mergedData.numbers.length === 0) {
        mergedData.numbers = DEFAULT_SITE_DATA.numbers;
      }
      if (!mergedData.numbersTitle) {
        mergedData.numbersTitle = DEFAULT_SITE_DATA.numbersTitle;
      }
      
      if (!mergedData.sections?.some(s => s.type === 'clients')) {
        const defaultClientsSection = DEFAULT_SITE_DATA.sections?.find(s => s.type === 'clients');
        if (defaultClientsSection) {
          mergedData.sections = [...(mergedData.sections || []), { ...defaultClientsSection, id: 's_clients_' + Date.now() }].sort((a, b) => a.order - b.order);
        }
      }

      if (!mergedData.sections?.some(s => s.type === 'numbers')) {
        const defaultNumbersSection = DEFAULT_SITE_DATA.sections?.find(s => s.type === 'numbers');
        if (defaultNumbersSection) {
          mergedData.sections = [...(mergedData.sections || []), { ...defaultNumbersSection, id: 's_numbers_' + Date.now() }].sort((a, b) => a.order - b.order);
        }
      }
      
      callback(mergedData);
    } else {
      callback(DEFAULT_SITE_DATA);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

// --- Portal Data ---

export const subscribeToPortalData = (clientId: string, callback: (data: any) => void) => {
  if (isRemixed) {
    callback(null);
    return () => {};
  }
  const path = `portals/${clientId}`;
  const portalDoc = doc(db, 'portals', clientId);
  return onSnapshot(portalDoc, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const updatePortalData = async (clientId: string, tasks: any[], acknowledgedTaskIds: string[]) => {
  if (isRemixed) {
    console.log("Mock updatePortalData for", clientId);
    return;
  }
  const path = `portals/${clientId}`;
  try {
    const portalDoc = doc(db, 'portals', clientId);
    await setDoc(portalDoc, {
      tasks,
      acknowledgedTaskIds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};