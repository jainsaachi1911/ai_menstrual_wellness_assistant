import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, getDoc, query, orderBy } from "firebase/firestore";

export async function saveUserProfile(uid, profile) {
  try {
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
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function addCycle(uid, cycleData) {
  try {
    const cyclesCol = collection(db, "users", uid, "cycles");
    return await addDoc(cyclesCol, {
      ...cycleData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding cycle:', error);
    throw error;
  }
}

export async function addAnalysis(uid, analysis) {
  try {
    const analysesCol = collection(db, "users", uid, "analyses");
    return await addDoc(analysesCol, {
      ...analysis,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding analysis:', error);
    throw error;
  }
}

export async function getCycles(uid) {
  try {
    const cyclesCol = collection(db, "users", uid, "cycles");
    const q = query(cyclesCol, orderBy("startDate", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting cycles:', error);
    throw error;
  }
}

export async function getAnalyses(uid) {
  try {
    const analysesCol = collection(db, "users", uid, "analyses");
    const q = query(analysesCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting analyses:', error);
    throw error;
  }
}

export async function saveAnalysisMetrics(uid, metrics) {
  try {
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
  } catch (error) {
    console.error('Error saving analysis metrics:', error);
    throw error;
  }
}

export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}
