import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_WKLEJ",
  authDomain: "TU_WKLEJ",
  projectId: "TU_WKLEJ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
