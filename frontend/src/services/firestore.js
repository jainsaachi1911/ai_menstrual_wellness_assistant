import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, getDoc, query, orderBy } from "firebase/firestore";

export async function saveUserProfile(uid, profile) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: profile?.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

export async function addCycle(uid, cycleData) {
  const cyclesCol = collection(db, "users", uid, "cycles");
  return await addDoc(cyclesCol, {
    ...cycleData,
    createdAt: serverTimestamp(),
  });
}

export async function addAnalysis(uid, analysis) {
  const analysesCol = collection(db, "users", uid, "analyses");
  return await addDoc(analysesCol, {
    ...analysis,
    createdAt: serverTimestamp(),
  });
}

export async function getCycles(uid) {
  const cyclesCol = collection(db, "users", uid, "cycles");
  const q = query(cyclesCol, orderBy("startDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAnalyses(uid) {
  const analysesCol = collection(db, "users", uid, "analyses");
  const q = query(analysesCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveAnalysisMetrics(uid, metrics) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      analysisMetrics: {
        ...metrics,
        lastCalculated: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}


