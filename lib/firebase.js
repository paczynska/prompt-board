import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUNsOJj4iIPkW35OBdZIPmO5GmfxnBiTE",
  authDomain: "prompt-app-86fbb.firebaseapp.com",
  projectId: "prompt-app-86fbb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
