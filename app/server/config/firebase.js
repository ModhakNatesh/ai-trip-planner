import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database'; // Changed from firestore
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the app root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

let admin;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  console.log('🔧 Firebase Config Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    PROJECT_ID: projectId,
    HAS_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    HAS_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL
  });
  
  const serviceAccount = {
    type: 'service_account',
    project_id: projectId,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  admin = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/` // Your Realtime DB URL
  });

  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  console.log('📝 Please ensure all Firebase environment variables are properly set');
}

// Export Firebase services
export const auth = admin ? getAuth(admin) : null;
export const db = admin ? getDatabase(admin) : null; // Changed from getFirestore

export default admin;