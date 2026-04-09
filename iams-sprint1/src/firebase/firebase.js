import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
// TODO: Replace these values with your Firebase project config.
// Go to: Firebase Console → Project Settings → Your Apps → SDK setup
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD3yS2hsE7xdkxPTDCyAMrptRTXmlPMMaU",
  authDomain: "iams1-6bf72.firebaseapp.com",
  projectId: "iams1-6bf72",
  storageBucket: "iams1-6bf72.firebasestorage.app",
  messagingSenderId: "895749122826",
  appId: "1:895749122826:web:37d35e34a01f6549e1a8f3",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)


