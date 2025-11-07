import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, getDoc, query, orderBy, deleteDoc } from "firebase/firestore";

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
    const snap = await getDocs(cyclesCol);
    const cycles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort by monthKey (YYYY-MM format) to maintain chronological month order
    cycles.sort((a, b) => {
      const keyA = a.monthKey || '';
      const keyB = b.monthKey || '';
      return keyA.localeCompare(keyB);
    });
    
    return cycles;
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

export async function findDuplicateCycles(uid) {
  try {
    const cycles = await getCycles(uid);
    const duplicateGroups = [];
    const seenCycles = new Map();

    for (const cycle of cycles) {
      const startISO = cycle.startDate?.toDate?.() ? cycle.startDate.toDate().toISOString().slice(0,10) : cycle.startDate;
      const endISO = cycle.endDate?.toDate?.() ? cycle.endDate.toDate().toISOString().slice(0,10) : cycle.endDate;
      
      if (!startISO || !endISO) continue;
      
      const key = `${startISO}-${endISO}`;
      
      if (seenCycles.has(key)) {
        const existing = seenCycles.get(key);
        if (!existing.duplicates) {
          existing.duplicates = [existing.cycle];
          duplicateGroups.push(existing);
        }
        existing.duplicates.push(cycle);
      } else {
        seenCycles.set(key, { key, cycle });
      }
    }

    return duplicateGroups;
  } catch (error) {
    console.error('Error finding duplicate cycles:', error);
    throw error;
  }
}

export async function removeDuplicateCycles(uid) {
  try {
    const duplicateGroups = await findDuplicateCycles(uid);
    let removedCount = 0;

    for (const group of duplicateGroups) {
      console.log(`Found ${group.duplicates.length} duplicates for cycle ${group.key}`);
      
      // Sort by creation date (newest first) and keep the most recent one
      const sorted = group.duplicates.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      // Keep the first (newest) and remove the rest
      const toKeep = sorted[0];
      const toRemove = sorted.slice(1);
      
      console.log(`Keeping cycle ${toKeep.id}, removing ${toRemove.length} duplicates`);
      
      for (const cycle of toRemove) {
        const cycleRef = doc(db, "users", uid, "cycles", cycle.id);
        await deleteDoc(cycleRef);
        removedCount++;
        console.log(`Removed duplicate cycle ${cycle.id}`);
      }
    }

    console.log(`Cleanup complete. Removed ${removedCount} duplicate cycles.`);
    return { removedCount, duplicateGroups: duplicateGroups.length };
  } catch (error) {
    console.error('Error removing duplicate cycles:', error);
    throw error;
  }
}

export async function addCycleWithDeduplication(uid, cycleData) {
  try {
    const cycles = await getCycles(uid);
    
    // Primary match: by monthKey (most reliable)
    let existing = null;
    if (cycleData.monthKey) {
      existing = cycles.find(cycle => cycle.monthKey === cycleData.monthKey);
    }
    
    // Fallback match: by date range
    if (!existing) {
      const startISO = cycleData.startDate instanceof Date ? 
        cycleData.startDate.toISOString().slice(0,10) : cycleData.startDate;
      const endISO = cycleData.endDate instanceof Date ? 
        cycleData.endDate.toISOString().slice(0,10) : cycleData.endDate;
      
      existing = cycles.find(cycle => {
        const existingStartISO = cycle.startDate?.toDate?.() ? 
          cycle.startDate.toDate().toISOString().slice(0,10) : cycle.startDate;
        const existingEndISO = cycle.endDate?.toDate?.() ? 
          cycle.endDate.toDate().toISOString().slice(0,10) : cycle.endDate;
        
        return existingStartISO === startISO && existingEndISO === endISO;
      });
    }
    
    if (existing) {
      // Update existing cycle
      const cycleRef = doc(db, "users", uid, "cycles", existing.id);
      await setDoc(cycleRef, {
        ...cycleData,
        updatedAt: serverTimestamp(),
        createdAt: existing.createdAt || serverTimestamp()
      });
      return { id: existing.id, updated: true };
    } else {
      // Create new cycle
      return await addCycle(uid, cycleData);
    }
  } catch (error) {
    console.error('Error adding cycle with deduplication:', error);
    throw error;
  }
}


export async function saveMetrics(uid, metrics) {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        metrics: {
          ...metrics,
          calculatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('Metrics saved successfully for user:', uid);
    return { success: true };
  } catch (error) {
    console.error('Error saving metrics:', error);
    throw error;
  }
}

export async function cleanupDuplicateCyclesKeepingSymptoms(uid) {
  try {
    const cycles = await getCycles(uid);
    const groupedByDateRange = new Map();
    
    // Group cycles by date range
    for (const cycle of cycles) {
      const startISO = cycle.startDate?.toDate?.() ? cycle.startDate.toDate().toISOString().slice(0,10) : cycle.startDate;
      const endISO = cycle.endDate?.toDate?.() ? cycle.endDate.toDate().toISOString().slice(0,10) : cycle.endDate;
      
      if (!startISO || !endISO) continue;
      
      const key = `${startISO}-${endISO}`;
      if (!groupedByDateRange.has(key)) {
        groupedByDateRange.set(key, []);
      }
      groupedByDateRange.get(key).push(cycle);
    }
    
    let removedCount = 0;
    
    // For each date range with duplicates, keep the one with symptoms
    for (const [dateRange, cyclesForRange] of groupedByDateRange) {
      if (cyclesForRange.length <= 1) continue;
      
      console.log(`Found ${cyclesForRange.length} cycles for ${dateRange}`);
      
      // Find cycles with symptoms
      const cyclesWithSymptoms = cyclesForRange.filter(c => 
        c.symptoms && typeof c.symptoms === 'object' && Object.keys(c.symptoms).length > 0
      );
      
      // If we have cycles with symptoms, keep the first one and remove the rest
      if (cyclesWithSymptoms.length > 0) {
        const toKeep = cyclesWithSymptoms[0];
        const toRemove = cyclesForRange.filter(c => c.id !== toKeep.id);
        
        console.log(`  Keeping cycle ${toKeep.id} (has symptoms), removing ${toRemove.length} duplicates`);
        
        for (const cycle of toRemove) {
          const cycleRef = doc(db, "users", uid, "cycles", cycle.id);
          await deleteDoc(cycleRef);
          removedCount++;
          console.log(`  Removed cycle ${cycle.id}`);
        }
      } else {
        // If none have symptoms, keep the first one and remove the rest
        const toKeep = cyclesForRange[0];
        const toRemove = cyclesForRange.slice(1);
        
        console.log(`  No cycles with symptoms. Keeping cycle ${toKeep.id}, removing ${toRemove.length} duplicates`);
        
        for (const cycle of toRemove) {
          const cycleRef = doc(db, "users", uid, "cycles", cycle.id);
          await deleteDoc(cycleRef);
          removedCount++;
          console.log(`  Removed cycle ${cycle.id}`);
        }
      }
    }
    
    console.log(`\nCleanup complete. Removed ${removedCount} duplicate cycles.`);
    return { removedCount, success: true };
  } catch (error) {
    console.error('Error in cleanupDuplicateCyclesKeepingSymptoms:', error);
    throw error;
  }
}
