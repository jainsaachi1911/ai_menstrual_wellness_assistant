import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { addCycle, addAnalysis, getCycles, removeDuplicateCycles, addCycleWithDeduplication, saveMetrics, getMetrics } from '../services/firestore';
import { 
  Activity, 
  Brain, 
  Zap, 
  Heart, 
  Wind, 
  Droplet,
  ArrowDown,
  Sparkles,
  Coffee,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../styles/AnalysisForm.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// Helper to calculate difference in days between two ISO date strings or Date objects
const diffInDays = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = (start instanceof Date) ? start : new Date(start);
  const b = (end instanceof Date) ? end : new Date(end);
  const diff = b - a;
  return Math.round(diff / msPerDay);
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

/**
 * parseOvulationValue:
 * - Accepts ISO date strings, or numeric strings/integers (1..31).
 * - For numeric: first tries day-of-month in same month as cycleStart,
 *   then falls back to day-of-cycle (cycleStart + (n-1) days).
 * - Returns a Date or null.
 */
const parseOvulationValue = (rawOv, cycleStartISO, nextCycleStartISO) => {
  if (rawOv === undefined || rawOv === null || rawOv === '') return null;

  const cycleStart = new Date(cycleStartISO);
  const nextStart = nextCycleStartISO ? new Date(nextCycleStartISO) : null;

  // try ISO parse
  const isoDate = new Date(rawOv);
  if (Number.isFinite(isoDate.getTime())) {
    // valid date
    return isoDate;
  }

  const asNum = Number(rawOv);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 31) {
    // try day-of-month (same month/year as cycleStart)
    const candidateDOM = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), asNum);
    if (Number.isFinite(candidateDOM.getTime())) {
      if (candidateDOM >= cycleStart && (!nextStart || candidateDOM < nextStart)) {
        return candidateDOM;
      }
    }

    // fallback: day-of-cycle (day 1 => cycleStart)
    const candidateDOC = new Date(cycleStart);
    candidateDOC.setDate(candidateDOC.getDate() + (asNum - 1));
    if (candidateDOC >= cycleStart && (!nextStart || candidateDOC < nextStart)) {
      return candidateDOC;
    }
  }

  return null;
};

const AnalysisForm = () => {
  // stored cycles keyed by month (YYYY-MM) — each entry { start, end, intensity, symptoms }
  const [cyclesMap, setCyclesMap] = useState({});
  const [cycles, setCycles] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [tempIntensity, setTempIntensity] = useState('');
  // Default symptoms template so we can easily reset / clone
  const memoizedInitialSymptoms = useMemo(() => ({
    cramps: 0,        // 0-5 intensity
    headache: false,  // toggle
    fatigue: 0,       // 0-5 intensity
    mood: 0,          // 0-3 rating
    bloating: false,  // toggle
    nausea: false,    // toggle
    backPain: 0,      // 0-5 intensity
    acne: false,      // toggle
    cravings: 0       // 0-3 rating
  }), []);

  // Helper function to ensure symptoms object is valid
  const ensureValidSymptoms = useCallback((symptoms) => {
    if (!symptoms || typeof symptoms !== 'object') {
      console.log('Invalid symptoms, using defaults:', symptoms);
      return memoizedInitialSymptoms;
    }
    // Merge with defaults to ensure all properties exist
    const merged = { ...memoizedInitialSymptoms, ...symptoms };
    console.log('Merged symptoms - defaults:', memoizedInitialSymptoms, 'saved:', symptoms, 'result:', merged);
    return merged;
  }, [memoizedInitialSymptoms]);

  const [symptoms, setSymptoms] = useState(() => memoizedInitialSymptoms);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [formData, setFormData] = useState({
    AvgCycleLength: '',
    AvgCycleLengthPercent: '',
    StdCycleLength: '',
    AvgMensesLength: '',
    TotalCycles: '',
    AvgLutealPhase: '',
    AvgOvulationDay: '',
    IrregularCyclesPercent: '',
    ShortLutealPercent: '',
    AvgBleedingIntensity: '',
    UnusualBleedingPercent: '',
    OvulationVariability: '',
    Age: '',
    BMI: '',
    Numberpreg: '',
    Abortions: '',
    AgeM: '',
    Breastfeeding: false
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const cyclesLoadedRef = useRef(false);
  const [cyclesLoaded, setCyclesLoaded] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Helper function to show notifications
  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      setAuthLoading(false);
      
      // Reset cycles when user logs out
      if (!user) {
        console.log('User logged out, resetting cycles');
        setCyclesMap({});
        setCyclesLoaded(false);
        cyclesLoadedRef.current = false;
      }
    });
    return () => unsubscribe();
  }, []);


  // Load cycles from Firestore so calendar persists across visits
  useEffect(() => {
    const load = async () => {
      if (!user || authLoading) {
        console.log('No user or still loading auth:', { user, authLoading });
        return;
      }
      
      // Prevent loading cycles multiple times for the same user
      if (cyclesLoadedRef.current === user.uid) {
        console.log('Cycles already loaded for this user, skipping reload');
        return;
      }
      
      try {
        console.log('Loading cycles from Firestore...');
        const list = await getCycles(user.uid);
        console.log('Cycles loaded:', list);
        
        // Build map keyed by YYYY-MM; prefer cycles with symptoms when duplicates exist
        const map = {};
        for (const c of list) {
          const startISO = c.startDate?.toDate?.() ? c.startDate.toDate().toISOString().slice(0,10) : c.startDate;
          const endISO = c.endDate?.toDate?.() ? c.endDate.toDate().toISOString().slice(0,10) : c.endDate;
          console.log('Processing cycle:', { startISO, endISO, intensity: c.intensity, symptoms: c.symptoms, symptomsType: typeof c.symptoms });
          if (!startISO || !endISO) continue;
          const key = getMonthKey(new Date(startISO));
          
          // Ensure symptoms is a valid object
          let symptomsToStore = c.symptoms;
          const hasSymptoms = symptomsToStore && typeof symptomsToStore === 'object';
          if (!hasSymptoms) {
            console.warn(`Invalid symptoms for ${key}, using defaults`);
            symptomsToStore = memoizedInitialSymptoms;
          }
          
          const newEntry = {
            start: startISO,
            end: endISO,
            intensity: c.intensity ? String(c.intensity) : (c.avgBleedingIntensity ? String(c.avgBleedingIntensity) : ''),
            symptoms: symptomsToStore,
            id: c.id,
          };
          
          // If this month key doesn't exist yet, or if current entry has symptoms and existing doesn't, use current
          const existingEntry = map[key];
          const existingHasSymptoms = existingEntry && existingEntry.symptoms && typeof existingEntry.symptoms === 'object' && Object.keys(existingEntry.symptoms).length > 0;
          const currentHasSymptoms = hasSymptoms && Object.keys(symptomsToStore).length > 0;
          
          if (!existingEntry || (currentHasSymptoms && !existingHasSymptoms)) {
            map[key] = newEntry;
            console.log(`Mapped cycle ${key}:`, { startISO, endISO, symptoms: symptomsToStore, preferred: !existingEntry ? 'first' : 'has_symptoms' });
          } else if (existingEntry) {
            console.log(`Skipped duplicate cycle ${key} (existing has symptoms: ${existingHasSymptoms}, current has symptoms: ${currentHasSymptoms})`);
          }
        }
        console.log('Built cyclesMap:', map);
        setCyclesMap(map);
        setCyclesLoaded(true);
        cyclesLoadedRef.current = user.uid;
        
        // Note: Form fields will be populated by the form update effect
        // after cyclesLoaded becomes true
      } catch (error) {
        console.error('Error loading cycles:', error);
      }
    };
    load();
  }, [user, authLoading, ensureValidSymptoms]);

  // Build cycles array whenever cyclesMap changes
  useEffect(() => {
    buildCyclesFromMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cyclesMap, ensureValidSymptoms]);

  // Monitor formData changes for debugging
  useEffect(() => {
    if (formData.AvgCycleLength || formData.IrregularCyclesPercent !== undefined) {
      console.log('\n=== FORM DATA UPDATED ===');
      console.log('AvgCycleLength:', formData.AvgCycleLength);
      console.log('AvgCycleLengthPercent:', formData.AvgCycleLengthPercent);
      console.log('IrregularCyclesPercent:', formData.IrregularCyclesPercent);
      console.log('StdCycleLength:', formData.StdCycleLength);
      console.log('AvgLutealPhase:', formData.AvgLutealPhase);
      console.log('ShortLutealPercent:', formData.ShortLutealPercent);
      console.log('AvgBleedingIntensity:', formData.AvgBleedingIntensity);
      console.log('UnusualBleedingPercent:', formData.UnusualBleedingPercent);
      console.log('AvgMensesLength:', formData.AvgMensesLength);
      console.log('AvgOvulationDay:', formData.AvgOvulationDay);
      console.log('OvulationVariability:', formData.OvulationVariability);
      console.log('TotalCycles:', formData.TotalCycles);
      console.log('=== END FORM DATA UPDATE ===\n');
    }
  }, [formData]);

  // Update form fields when cyclesMap is loaded and currentDate changes
  useEffect(() => {
    // Only update form if cycles have been loaded from Firestore
    if (!cyclesLoaded) {
      console.log('Cycles not yet loaded, skipping form update');
      return;
    }
    
    const key = getMonthKey(currentDate);
    console.log('Form update effect triggered - key:', key, 'cyclesLoaded:', cyclesLoaded);
    console.log('Current cyclesMap keys:', Object.keys(cyclesMap));
    const saved = cyclesMap[key];
    console.log('Saved data for key:', saved);
    if (saved) {
      console.log('Setting form from saved data for', key);
      setTempStart(saved.start || '');
      setTempEnd(saved.end || '');
      setTempIntensity(saved.intensity || '');
      const symptomsToSet = ensureValidSymptoms(saved.symptoms);
      console.log('Setting symptoms for month:', key);
      console.log('Raw symptoms from DB:', JSON.stringify(saved.symptoms));
      console.log('Validated symptoms to set:', JSON.stringify(symptomsToSet));
      setSymptoms(symptomsToSet);
      console.log('Form populated with symptoms for', key);
    } else {
      console.log('No saved data for', key, '- clearing form');
      console.log('Available keys in cyclesMap:', Object.keys(cyclesMap));
      console.log('Full cyclesMap:', JSON.stringify(cyclesMap, null, 2));
      setTempStart('');
      setTempEnd('');
      setTempIntensity('');
      setSymptoms(memoizedInitialSymptoms);
      console.log('Form cleared, using initial symptoms');
    }
  }, [currentDate.getFullYear(), currentDate.getMonth(), cyclesMap, cyclesLoaded, ensureValidSymptoms, memoizedInitialSymptoms, user]);

  const buildCyclesFromMap = useCallback(() => {
    const arr = Object.entries(cyclesMap).map(([month, obj]) => ({ month, ...obj }));
    arr.sort((a, b) => {
      if (a.start && b.start) return new Date(a.start) - new Date(b.start);
      return a.month.localeCompare(b.month);
    });
    setCycles(arr);
    return arr;
  }, [cyclesMap, ensureValidSymptoms]);

  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    console.log('Changing month to:', getMonthKey(d));
    setCurrentDate(d);
  };

  const saveCurrentMonth = async () => {
    const key = getMonthKey(currentDate);
    console.log('Saving cycle for key:', key, { start: tempStart, end: tempEnd, intensity: tempIntensity, symptoms: JSON.stringify(symptoms) });
    
    if (!tempStart || !tempEnd) {
      showNotification('Please enter both start and end dates', 'error');
      return;
    }
    
    setCyclesMap(prev => ({ ...prev, [key]: { start: tempStart, end: tempEnd, intensity: tempIntensity, symptoms } }));
    setTimeout(buildCyclesFromMap, 0);
    
    try {
      if (user && tempStart && tempEnd) {
        const mensesLengthDays = diffInDays(tempStart, tempEnd) + 1;
        const symptomsToSave = { ...symptoms };
        console.log('Saving to Firestore for month:', key);
        console.log('Symptoms being saved:', JSON.stringify(symptomsToSave));
        const result = await addCycleWithDeduplication(user.uid, {
          startDate: new Date(tempStart),
          endDate: new Date(tempEnd),
          monthKey: key,
          intensity: tempIntensity ? Number(tempIntensity) : null,
          bleedingByDay: null,
          unusualBleedingByDay: null,
          mensesLengthDays,
          symptoms: symptomsToSave,
        });
        console.log('Cycle saved result:', result);
        console.log('Cycle saved successfully for month:', key, 'with symptoms:', JSON.stringify(symptomsToSave));
        
        if (result.updated) {
          showNotification('Cycle updated successfully with symptoms!', 'success');
        } else {
          showNotification('Cycle saved successfully with symptoms!', 'success');
        }
      }
    } catch (e) {
      console.error('Error saving cycle:', e);
      showNotification(`Error saving cycle: ${e.message || 'Unknown error'}`, 'error', 5000);
    }
  };

  const clearCurrentMonth = async () => {
    const key = getMonthKey(currentDate);
    
    // Get the cycle ID to delete from Firestore
    const cycleToDelete = cyclesMap[key];
    
    // Clear local state
    setCyclesMap(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    setTempStart('');
    setTempEnd('');
    setTempIntensity('');
    setSymptoms(memoizedInitialSymptoms);
    
    // Delete from Firestore if cycle exists
    if (user && cycleToDelete && cycleToDelete.id) {
      try {
        console.log('Deleting cycle from Firestore:', cycleToDelete.id);
        const { deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        await deleteDoc(doc(db, 'users', user.uid, 'cycles', cycleToDelete.id));
        console.log('Cycle deleted successfully from Firestore');
        showNotification('Month cleared and deleted from database', 'success');
      } catch (error) {
        console.error('Error deleting cycle from Firestore:', error);
        showNotification('Month cleared locally but failed to delete from database', 'warning', 5000);
      }
    } else {
      showNotification('Month cleared', 'info');
    }
    
    setTimeout(buildCyclesFromMap, 0);
  };


  const toggleSymptom = (symptom) => {
    console.log('Toggling symptom:', symptom, 'from', symptoms[symptom], 'to', !symptoms[symptom]);
    setSymptoms(prev => {
      const newSymptoms = {
        ...prev,
        [symptom]: !prev[symptom]
      };
      console.log('New symptoms state:', newSymptoms);
      return newSymptoms;
    });
  };

  const setSymptomIntensity = (symptom, value) => {
    console.log('Setting symptom intensity:', symptom, 'to', value);
    setSymptoms(prev => {
      const newSymptoms = {
        ...prev,
        [symptom]: value
      };
      console.log('New symptoms state:', newSymptoms);
      return newSymptoms;
    });
  };

  const adjustSymptomIntensity = (symptom, delta) => {
    const newValue = Math.max(0, Math.min(5, symptoms[symptom] + delta));
    console.log('Adjusting symptom intensity:', symptom, 'from', symptoms[symptom], 'by', delta, 'to', newValue);
    setSymptoms(prev => {
      const newSymptoms = {
        ...prev,
        [symptom]: newValue
      };
      console.log('New symptoms state:', newSymptoms);
      return newSymptoms;
    });
  };

  const handleDayClick = (iso) => {
    if (!tempStart) {
      setTempStart(iso);
      setTempEnd('');
      return;
    }
    if (tempStart && !tempEnd) {
      if (new Date(iso) >= new Date(tempStart)) {
        setTempEnd(iso);
      } else {
        setTempStart(iso);
        setTempEnd('');
      }
      return;
    }
    setTempStart(iso);
    setTempEnd('');
  };

  // MAIN: compute metrics
  const computeMetrics = async () => {
    const arr = buildCyclesFromMap();
    const completed = arr.filter(c => c.start && c.end);

    if (completed.length < 2) {
      alert('Please enter at least 2 complete cycles to calculate metrics');
      return;
    }

    // Cycle lengths between starts
    const L = [];
    for (let i = 0; i < completed.length - 1; i++) {
      L.push(diffInDays(completed[i].start, completed[i + 1].start));
    }

    const avgCycle = L.reduce((a, b) => a + b, 0) / L.length;
    // mean absolute percent deviation
    const percentDeviations = L.map(li => (Math.abs(li - avgCycle) / avgCycle) * 100);
    const avgPercentDeviation = percentDeviations.length > 0
      ? (percentDeviations.reduce((a, b) => a + b, 0) / percentDeviations.length)
      : 0;

    const stdCycle = L.length > 1
      ? Math.sqrt(L.reduce((sum, li) => sum + Math.pow(li - avgCycle, 2), 0) / (L.length - 1))
      : 0;

    // Menses lengths
    const M = completed.map(c => diffInDays(c.start, c.end) + 1);
    const avgMenses = M.reduce((a, b) => a + b, 0) / M.length;

    // Ovulation day estimate variability based on avgCycle - assumedLuteal
    const assumedLuteal = 14;
    const ovDays = L.map(li => li - assumedLuteal);
    const avgOvDay = ovDays.reduce((a, b) => a + b, 0) / ovDays.length;
    const ovVar = ovDays.length > 1
      ? Math.sqrt(ovDays.reduce((sum, v) => sum + Math.pow(v - avgOvDay, 2), 0) / (ovDays.length - 1))
      : 0;

    // Irregular cycles percent (threshold in days)
  const irregularThreshold = 7;
  const irregularCount = L.filter(li => Math.abs(li - avgCycle) >= irregularThreshold).length;
  const irregularPercent = L.length > 0 ? (irregularCount / L.length) * 100 : 0;

  const lutealEstimates = [];

  for (let i = 0; i < completed.length - 1; i++) {
    const thisCycle = completed[i];
    const nextCycleStart = completed[i + 1].start; // string ISO

    // 1) If explicit ovulation provided, try to parse and validate it
    let ovDate = null;
    if (thisCycle.ovulation !== undefined && thisCycle.ovulation !== null && thisCycle.ovulation !== '') {
      ovDate = parseOvulationValue(thisCycle.ovulation, thisCycle.start, nextCycleStart);
      // only accept if valid and before next start
      if (!ovDate || ovDate >= new Date(nextCycleStart)) {
        ovDate = null;
      }
    }

    // 2) If no explicit ovulation, infer one reasonably:
    //    estimateOvationOffset = round(avgCycle - assumedLuteal)
    //    ovDate = cycleStart + estimateOvationOffset days
    // This lets luteal vary with per-cycle L (final luteal becomes 14 + (li - avgCycle))
    if (!ovDate) {
      const estimateOffset = Math.round(avgCycle - assumedLuteal);
      const candidate = new Date(thisCycle.start);
      candidate.setDate(candidate.getDate() + estimateOffset);
      // validation: must be after cycle start and before next start
      if (candidate > new Date(thisCycle.start) && candidate < new Date(nextCycleStart)) {
        ovDate = candidate;
      } else {
        // if the estimate falls outside, try a safer fallback:
        // choose middle point between cycle start and next start minus assumedLuteal/2
        const li = diffInDays(thisCycle.start, nextCycleStart);
        const fallbackOffset = Math.max(1, Math.round(li - assumedLuteal)); // day-of-cycle style
        const fallback = new Date(thisCycle.start);
        fallback.setDate(fallback.getDate() + fallbackOffset);
        if (fallback > new Date(thisCycle.start) && fallback < new Date(nextCycleStart)) {
          ovDate = fallback;
        } else {
          ovDate = null;
        }
      }

      if (!ovDate) continue;

      const lutealEstimate = diffInDays(ovDate, nextCycleStart);
      if (Number.isFinite(lutealEstimate) && lutealEstimate >= 7 && lutealEstimate <= 24) {
        lutealEstimates.push(lutealEstimate);
      }
    }
    }

    // Compute short luteal percentage: <= 11 days considered short (inclusive)
    const shortLutealThreshold = 11;
    let shortLutealPercent = null;
    if (lutealEstimates.length > 0) {
      const shortCount = lutealEstimates.filter(l => l <= shortLutealThreshold).length;
      shortLutealPercent = (shortCount / lutealEstimates.length) * 100;
    } else {
      shortLutealPercent = null; // insufficient data
    }

    // Bleeding intensity
    const intensityValues = completed
      .map(c => {
        const v = Number(c.intensity);
        return (Number.isFinite(v) && v >= 1 && v <= 5) ? v : null;
      })
      .filter(v => v !== null);

    const avgIntensity = intensityValues.length > 0
      ? intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length
      : 0;

    const unusualCount = completed.reduce((count, c) => {
      const mLen = diffInDays(c.start, c.end) + 1;
      const intVal = Number(c.intensity);
      const heavy = Number.isFinite(intVal) && intVal >= 4;
      const unusualDuration = (mLen < 3 || mLen > 7);
      return count + ((heavy || unusualDuration) ? 1 : 0);
    }, 0);

    const unusualPercent = completed.length > 0 ? (unusualCount / completed.length) * 100 : 0;

    // DEBUG: Log all calculated values
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         COMPREHENSIVE METRICS CALCULATION SUMMARY              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n📊 CYCLE DATA:');
    console.log('  • Completed cycles:', completed.length);
    console.log('  • Cycle lengths (L):', L);
    console.log('  • Menses lengths (M):', M);
    console.log('\n📈 CYCLE LENGTH METRICS:');
    console.log('  • Average cycle length:', avgCycle.toFixed(1), 'days');
    console.log('  • Std deviation:', stdCycle.toFixed(1), 'days');
    console.log('  • Avg percent deviation:', avgPercentDeviation.toFixed(1), '%');
    console.log('  • Irregular cycles percent:', irregularPercent.toFixed(1), '%');
    console.log('\n🩸 BLEEDING METRICS:');
    console.log('  • Average menses length:', avgMenses.toFixed(1), 'days');
    console.log('  • Intensity values:', intensityValues);
    console.log('  • Average bleeding intensity:', avgIntensity.toFixed(1));
    console.log('  • Unusual bleeding percent:', unusualPercent.toFixed(1), '%');
    console.log('\n🔄 OVULATION & LUTEAL METRICS:');
    console.log('  • Ovulation days (of cycle):', ovDays);
    console.log('  • Average ovulation day:', avgOvDay.toFixed(1));
    console.log('  • Ovulation variability:', ovVar.toFixed(1), 'days');
    console.log('  • Luteal estimates:', lutealEstimates);
    console.log('  • Average luteal phase:', (lutealEstimates.length > 0 ? (lutealEstimates.reduce((a,b)=>a+b)/lutealEstimates.length).toFixed(1) : 'N/A'), 'days');
    console.log('  • Short luteal percent:', shortLutealPercent !== null ? shortLutealPercent.toFixed(1) : 'N/A', '%');
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      END SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Prepare metrics object to save
    const metricsToSave = {
      AvgCycleLength: Number.isFinite(avgCycle) ? parseFloat(avgCycle.toFixed(1)) : null,
      AvgCycleLengthPercent: Number.isFinite(avgPercentDeviation) ? parseFloat(avgPercentDeviation.toFixed(1)) : null,
      StdCycleLength: Number.isFinite(stdCycle) ? parseFloat(stdCycle.toFixed(1)) : null,
      AvgMensesLength: Number.isFinite(avgMenses) ? parseFloat(avgMenses.toFixed(1)) : null,
      TotalCycles: completed.length,
      AvgLutealPhase: lutealEstimates.length > 0
        ? parseFloat((lutealEstimates.reduce((a, b) => a + b, 0) / lutealEstimates.length).toFixed(1))
        : parseFloat(assumedLuteal.toFixed(1)),
      AvgOvulationDay: Number.isFinite(avgOvDay) ? parseFloat(avgOvDay.toFixed(1)) : null,
      IrregularCyclesPercent: Number.isFinite(irregularPercent) ? parseFloat(irregularPercent.toFixed(1)) : null,
      ShortLutealPercent: shortLutealPercent !== null && Number.isFinite(shortLutealPercent)
        ? parseFloat(shortLutealPercent.toFixed(1))
        : null,
      OvulationVariability: Number.isFinite(ovVar) ? parseFloat(ovVar.toFixed(1)) : null,
      AvgBleedingIntensity: Number.isFinite(avgIntensity) ? parseFloat(avgIntensity.toFixed(1)) : null,
      UnusualBleedingPercent: Number.isFinite(unusualPercent) ? parseFloat(unusualPercent.toFixed(1)) : null
    };

    // Update form fields (1 decimal) - use nullish coalescing to handle zero values
    setFormData(prev => ({
      ...prev,
      AvgCycleLength: metricsToSave.AvgCycleLength ?? '',
      AvgCycleLengthPercent: metricsToSave.AvgCycleLengthPercent ?? '',
      StdCycleLength: metricsToSave.StdCycleLength ?? '',
      AvgMensesLength: metricsToSave.AvgMensesLength ?? '',
      TotalCycles: metricsToSave.TotalCycles,
      AvgLutealPhase: metricsToSave.AvgLutealPhase ?? '',
      AvgOvulationDay: metricsToSave.AvgOvulationDay ?? '',
      IrregularCyclesPercent: metricsToSave.IrregularCyclesPercent ?? '',
      ShortLutealPercent: metricsToSave.ShortLutealPercent ?? '',
      OvulationVariability: metricsToSave.OvulationVariability ?? '',
      AvgBleedingIntensity: metricsToSave.AvgBleedingIntensity ?? '',
      UnusualBleedingPercent: metricsToSave.UnusualBleedingPercent ?? ''
    }));

    // Save metrics to Firestore
    if (user) {
      try {
        console.log('\n=== SAVING METRICS TO FIRESTORE ===');
        console.log('Metrics to save:', JSON.stringify(metricsToSave, null, 2));
        await saveMetrics(user.uid, metricsToSave);
        console.log('Metrics saved successfully');
        console.log('=== END SAVE ===\n');
        showNotification('Metrics calculated and saved successfully!', 'success');
      } catch (error) {
        console.error('Error saving metrics:', error);
        showNotification('Metrics calculated but failed to save to database', 'error', 5000);
      }
    } else {
      showNotification('Metrics calculated (not saved - user not logged in)', 'info');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const features = { ...formData, cycles: buildCyclesFromMap() };
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      const data = await response.json();
      const payload = data.results || data;
      setResults(payload);

      if (user) {
        try {
          await addAnalysis(user.uid, {
            inputFeatures: { ...formData },
            cyclesSnapshot: buildCyclesFromMap(),
            modelsRun: ["risk"],
            riskCategory: payload?.riskCategory || payload?.category || null,
            riskProbabilities: payload?.riskProbabilities || payload?.probabilities || null,
            prwiScore: payload?.prwiScore ?? null,
            clusterLabel: payload?.clusterLabel ?? null,
            deviationScore: payload?.deviationScore ?? null,
            recommendations: payload?.recommendations ?? [],
            confidence: payload?.confidence ?? null,
          });
        } catch (e) {
          // optional: surface a toast
        }
      }
    } catch (err) {
      setError('Failed to analyze data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const prevMonthLastDay = new Date(year, month, 0);
  const prevDays = prevMonthLastDay.getDate();
  const prevYear = prevMonthLastDay.getFullYear();
  const prevMonthIndex = prevMonthLastDay.getMonth();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstWeekday + 1;
    let cellDate, inCurrentMonth;
    if (dayNum <= 0) {
      const d = prevDays + dayNum;
      cellDate = new Date(prevYear, prevMonthIndex, d);
      inCurrentMonth = false;
    } else if (dayNum > totalDays) {
      const d = dayNum - totalDays;
      const next = new Date(year, month + 1, 1);
      cellDate = new Date(next.getFullYear(), next.getMonth(), d);
      inCurrentMonth = false;
    } else {
      cellDate = new Date(year, month, dayNum);
      inCurrentMonth = true;
    }
    const iso = cellDate.toISOString().slice(0, 10);
    const isStart = tempStart === iso;
    const isEnd = tempEnd === iso;
    const inRange = tempStart && tempEnd && (new Date(iso) >= new Date(tempStart)) && (new Date(iso) <= new Date(tempEnd));
    cells.push({ iso, day: cellDate.getDate(), inCurrentMonth, isStart, isEnd, inRange });
  }

  return (
    <div className="analysis-form-container">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Welcoming Header */}
      <div className="calendar-header">
        <h2>Your Wellness Journey</h2>
      </div>

      <div className="period-tracker">
        <div className="calendar-nav">
          <button type="button" className="nav-arrow" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h3 className="calendar-month">{currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
          <button type="button" className="nav-arrow" onClick={() => changeMonth(1)}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700 }}>{d}</div>
          ))}

          {cells.map((c, idx) => (
            <div
              key={idx}
              onClick={() => handleDayClick(c.iso)}
              role="button"
              tabIndex={0}
              style={{
                aspectRatio: '1 / 1',
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: 6,
                background: c.isStart ? '#e6f4ff' : c.isEnd ? '#fff0f0' : c.inRange ? '#f0f8ff' : (c.inCurrentMonth ? 'white' : '#fafafa'),
                color: c.inCurrentMonth ? 'inherit' : '#999',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600 }}>{c.day}</div>
                {c.isStart && <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#2b6cb0', color: 'white' }}>Start</div>}
                {c.isEnd && <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#e53e3e', color: 'white' }}>End</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="calendar-actions">
          <button type="button" onClick={clearCurrentMonth}>Clear Month</button>
          <button type="button" onClick={saveCurrentMonth}>Save Month</button>
        </div>

        {/* <div style={{ marginTop: 16 }}>
          <h4>Tracked Months</h4>
          {Object.keys(cyclesMap).length === 0 && <div>No months saved yet.</div>}
          {Object.entries(cyclesMap).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <strong>{k}</strong>
              <div>Start: {v.start || '-'}</div>
              <div>End: {v.end || '-'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontWeight: 700 }}>{d}</div>
        ))}

        {cells.map((c, idx) => (
          <div
            key={idx}
            onClick={() => handleDayClick(c.iso)}
            role="button"
            tabIndex={0}
            style={{
              aspectRatio: '1 / 1',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: 6,
              background: c.isStart ? '#e6f4ff' : c.isEnd ? '#fff0f0' : c.inRange ? '#f0f8ff' : (c.inCurrentMonth ? 'white' : '#fafafa'),
              color: c.inCurrentMonth ? 'inherit' : '#999',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>{c.day}</div>
              {c.isStart && <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#2b6cb0', color: 'white' }}>Start</div>}
              {c.isEnd && <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#e53e3e', color: 'white' }}>End</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-actions">
        <button type="button" onClick={saveCurrentMonth}>Save Month</button>
        <button type="button" onClick={clearCurrentMonth}>Clear Month</button>
        <button type="button" onClick={computeMetrics}>Calculate Metrics</button>
        <button type="button" onClick={cleanupDuplicates} className="cleanup-btn">Clean Duplicates</button>
      </div>
    </div>

    {/* Symptoms Tracker */}
    <div className="symptoms-card">
      <h4>How did you feel this month?</h4>
      
      {/* Bleeding Intensity */}
      <div className="symptom-section">
        <h5>Flow Intensity</h5>
        <div className="intensity-selector">
          {[1,2,3,4,5].map(lv => (
            <div
              key={lv}
              className={`intensity-box level-${lv} ${Number(tempIntensity)===lv ? 'active' : ''}`}
              onClick={() => setTempIntensity(String(lv))}
              role="button"
              tabIndex={0}
              onKeyPress={(e)=>{if(e.key==='Enter') setTempIntensity(String(lv));}}
            />
          ))}
        </div>
      </div>
      
      {/* Intensity-based symptoms with slider */}
      <div className="symptom-section">
        <h5>Intensity Symptoms</h5>
        <div className="symptoms-intensity-grid">
          {/* Cramps Intensity */}
          <div className="symptom-intensity-item">
              <div className="symptom-header">
                <Activity size={20} className="symptom-icon" />
                <span className="symptom-label">Cramps</span>
              </div>
              <div className="intensity-controls">
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('cramps', -1)}
                  disabled={symptoms.cramps === 0}
                >
                  <Minus size={14} />
                </button>
                <div className="intensity-bar">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div 
                      key={level}
                      className={`intensity-level ${symptoms.cramps >= level ? 'active' : ''}`}
                      data-symptom="cramps"
                      onClick={() => setSymptomIntensity('cramps', level)}
                    />
                  ))}
                </div>
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('cramps', 1)}
                  disabled={symptoms.cramps === 5}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

          {/* Fatigue Intensity */}
          <div className="symptom-intensity-item">
              <div className="symptom-header">
                <Zap size={20} className="symptom-icon" />
                <span className="symptom-label">Fatigue</span>
              </div>
              <div className="intensity-controls">
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('fatigue', -1)}
                  disabled={symptoms.fatigue === 0}
                >
                  <Minus size={14} />
                </button>
                <div className="intensity-bar">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div 
                      key={level}
                      className={`intensity-level ${symptoms.fatigue >= level ? 'active' : ''}`}
                      data-symptom="fatigue"
                      onClick={() => setSymptomIntensity('fatigue', level)}
                    />
                  ))}
                </div>
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('fatigue', 1)}
                  disabled={symptoms.fatigue === 5}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

          {/* Back Pain Intensity */}
          <div className="symptom-intensity-item">
              <div className="symptom-header">
                <ArrowDown size={20} className="symptom-icon" />
                <span className="symptom-label">Back Pain</span>
              </div>
              <div className="intensity-controls">
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('backPain', -1)}
                  disabled={symptoms.backPain === 0}
                >
                  <Minus size={14} />
                </button>
                <div className="intensity-bar">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div 
                      key={level}
                      className={`intensity-level ${symptoms.backPain >= level ? 'active' : ''}`}
                      data-symptom="backPain"
                      onClick={() => setSymptomIntensity('backPain', level)}
                    />
                  ))}
                </div>
                <button 
                  type="button"
                  className="intensity-btn"
                  onClick={() => adjustSymptomIntensity('backPain', 1)}
                  disabled={symptoms.backPain === 5}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Toggle symptoms */}
      <div className="symptom-section">
          <h5>Yes/No Symptoms</h5>
          <div className="symptoms-toggle-grid">
            <div 
              className={`symptom-toggle ${symptoms.headache ? 'active' : ''}`}
              onClick={() => toggleSymptom('headache')}
              data-symptom="headache"
            >
              <Brain size={22} />
              <span>Headache</span>
            </div>
            
            <div 
              className={`symptom-toggle ${symptoms.bloating ? 'active' : ''}`}
              onClick={() => toggleSymptom('bloating')}
              data-symptom="bloating"
            >
              <Wind size={22} />
              <span>Bloating</span>
            </div>
            
            <div 
              className={`symptom-toggle ${symptoms.nausea ? 'active' : ''}`}
              onClick={() => toggleSymptom('nausea')}
              data-symptom="nausea"
            >
              <Droplet size={22} />
              <span>Nausea</span>
            </div>
            
            <div 
              className={`symptom-toggle ${symptoms.acne ? 'active' : ''}`}
              onClick={() => toggleSymptom('acne')}
              data-symptom="acne"
            >
              <Sparkles size={22} />
              <span>Acne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating symptoms */}
      <div className="symptom-section">
          <h5>Rate Severity</h5>
          <div className="symptoms-rating-grid">
            {/* Mood Swings Rating */}
            <div className="symptom-rating-item">
              <div className="symptom-header">
                <Heart size={20} className="symptom-icon" />
                <span className="symptom-label">Mood Swings</span>
              </div>
              <div className="rating-dots">
                {[1, 2, 3].map(level => (
                  <div
                    key={level}
                    className={`rating-dot ${symptoms.mood >= level ? 'active' : ''}`}
                    data-symptom="mood"
                    onClick={() => setSymptomIntensity('mood', symptoms.mood === level ? 0 : level)}
                  />
                ))}
              </div>
            </div>

            {/* Cravings Rating */}
            <div className="symptom-rating-item">
              <div className="symptom-header">
                <Coffee size={20} className="symptom-icon" />
                <span className="symptom-label">Cravings</span>
              </div>
              <div className="rating-dots">
                {[1, 2, 3].map(level => (
                  <div
                    key={level}
                    className={`rating-dot ${symptoms.cravings >= level ? 'active' : ''}`}
                    data-symptom="cravings"
                    onClick={() => setSymptomIntensity('cravings', symptoms.cravings === level ? 0 : level)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Metrics Button */}
      <div className="metrics-button-container">
        <button type="button" className="calculate-metrics-btn" onClick={computeMetrics}>
          Calculate Metrics
        </button>
      </div>

  </div>
  );
};

export default AnalysisForm;