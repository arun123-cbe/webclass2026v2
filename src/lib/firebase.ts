import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCQpaEkSQbGBBZULYaspbgmKCgJ1z4DEM",
  authDomain: "gen-lang-client-0018141123.firebaseapp.com",
  projectId: "gen-lang-client-0018141123",
  storageBucket: "gen-lang-client-0018141123.firebasestorage.app",
  messagingSenderId: "826020756891",
  appId: "1:826020756891:web:12b39aea30097029f8b53e"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
const db = getFirestore(app, "ai-studio-d220273b-b7a8-43af-ac2f-eb05ea89acf5");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup as requested in firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "students", "test_connection_probe"));
    console.log("Firebase connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Please check your Firebase configuration or network status.", error);
    } else {
      console.log("Firebase initialized successfully (probe response received).");
    }
  }
}
testConnection();

export { app, db };
export default db;
