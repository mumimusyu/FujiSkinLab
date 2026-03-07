import { getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBR_XUom4YRF0CvR33vecOdkX9FH5rNItI",
  authDomain: "skinnest-77fea.firebaseapp.com",
  projectId: "skinnest-77fea",
  storageBucket: "skinnest-77fea.firebasestorage.app",
  messagingSenderId: "1006033526199",
  appId: "1:1006033526199:web:5f5ba61284790e94da9c32",
}

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)