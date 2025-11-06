import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { addCycle, addAnalysis, getCycles } from '../services/firestore';
import '../styles/AnalysisForm.css';

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
  // stored cycles keyed by month (YYYY-MM) — each entry { start, end, intensity, ovulation? }
  const [cyclesMap, setCyclesMap] = useState({});
  const [cycles, setCycles] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [tempIntensity, setTempIntensity] = useState('');

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

  useEffect(() => {
    const key = getMonthKey(currentDate);
    const saved = cyclesMap[key];
    if (saved) {
      setTempStart(saved.start || '');
      setTempEnd(saved.end || '');
      setTempIntensity(saved.intensity || '');
    } else {
      setTempStart('');
      setTempEnd('');
      setTempIntensity('');
    }
  }, [currentDate, cyclesMap]);

  // Load cycles from Firestore so calendar persists across visits
  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      try {
        const list = await getCycles(auth.currentUser.uid);
        // Build map keyed by YYYY-MM; for overlapping months, last write wins
        const map = {};
        for (const c of list) {
          const startISO = c.startDate?.toDate?.() ? c.startDate.toDate().toISOString().slice(0,10) : c.startDate;
          const endISO = c.endDate?.toDate?.() ? c.endDate.toDate().toISOString().slice(0,10) : c.endDate;
          if (!startISO || !endISO) continue;
          const key = getMonthKey(new Date(startISO));
          map[key] = {
            start: startISO,
            end: endISO,
            intensity: c.intensity ? String(c.intensity) : (c.avgBleedingIntensity ? String(c.avgBleedingIntensity) : ''),
          };
        }
        setCyclesMap(map);
        setTimeout(buildCyclesFromMap, 0);
      } catch (_) {
        // ignore load errors for now
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildCyclesFromMap = () => {
    const arr = Object.entries(cyclesMap).map(([month, obj]) => ({ month, ...obj }));
    arr.sort((a, b) => {
      if (a.start && b.start) return new Date(a.start) - new Date(b.start);
      return a.month.localeCompare(b.month);
    });
    setCycles(arr);
    return arr;
  };

  const saveCurrentMonth = async () => {
    const key = getMonthKey(currentDate);
    setCyclesMap(prev => ({ ...prev, [key]: { start: tempStart, end: tempEnd, intensity: tempIntensity } }));
    setTimeout(buildCyclesFromMap, 0);
    try {
      if (auth.currentUser && tempStart && tempEnd) {
        const mensesLengthDays = diffInDays(tempStart, tempEnd) + 1;
        await addCycle(auth.currentUser.uid, {
          startDate: new Date(tempStart),
          endDate: new Date(tempEnd),
          monthKey: key,
          intensity: tempIntensity ? Number(tempIntensity) : null,
          bleedingByDay: null,
          unusualBleedingByDay: null,
          mensesLengthDays,
        });
      }
    } catch (e) {
      // swallow for now; optionally surface a toast
    }
  };

  const clearCurrentMonth = () => {
    const key = getMonthKey(currentDate);
    setCyclesMap(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    setTempStart(''); setTempEnd(''); setTempIntensity('');
    setTimeout(buildCyclesFromMap, 0);
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

  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  // MAIN: compute metrics
  const computeMetrics = () => {
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

    // Build luteal estimates using explicit ovulation where available,
    // otherwise estimate ovulation using avgCycle - assumedLuteal heuristic.
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
      }

      if (!ovDate) continue;

      const lutealEstimate = diffInDays(ovDate, nextCycleStart);
      if (Number.isFinite(lutealEstimate) && lutealEstimate >= 7 && lutealEstimate <= 24) {
        lutealEstimates.push(lutealEstimate);
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

    // Update form fields (1 decimal)
    setFormData(prev => ({
      ...prev,
      AvgCycleLength: Number.isFinite(avgCycle) ? avgCycle.toFixed(1) : '',
      AvgCycleLengthPercent: Number.isFinite(avgPercentDeviation) ? avgPercentDeviation.toFixed(1) : '',
      StdCycleLength: Number.isFinite(stdCycle) ? stdCycle.toFixed(1) : '',
      AvgMensesLength: Number.isFinite(avgMenses) ? avgMenses.toFixed(1) : '',
      TotalCycles: completed.length,
      AvgLutealPhase: lutealEstimates.length > 0
        ? (lutealEstimates.reduce((a, b) => a + b, 0) / lutealEstimates.length).toFixed(1)
        : assumedLuteal.toFixed(1),
      AvgOvulationDay: Number.isFinite(avgOvDay) ? avgOvDay.toFixed(1) : '',
      IrregularCyclesPercent: Number.isFinite(irregularPercent) ? irregularPercent.toFixed(1) : '',
      ShortLutealPercent: shortLutealPercent !== null && Number.isFinite(shortLutealPercent)
        ? shortLutealPercent.toFixed(1)
        : '', // blank => insufficient luteal/ovulation data
      OvulationVariability: Number.isFinite(ovVar) ? ovVar.toFixed(1) : '',
      AvgBleedingIntensity: avgIntensity > 0 ? avgIntensity.toFixed(1) : '',
      UnusualBleedingPercent: Number.isFinite(unusualPercent) ? unusualPercent.toFixed(1) : ''
    }));
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
      const response = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      const data = await response.json();
      const payload = data.results || data;
      setResults(payload);

      if (auth.currentUser) {
        try {
          await addAnalysis(auth.currentUser.uid, {
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
    <div className="analysis-form-container" style={{ maxWidth: 980, margin: '0 auto', padding: 30 ,borderRadius: 25}}>
      <div className="period-tracker" style={{ padding: 32, border: '1px solid #eee', borderRadius: 8, background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button type="button" onClick={() => changeMonth(-1)}>&lt;</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button type="button" onClick={() => changeMonth(1)}>&gt;</button>
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
                minHeight: 70,
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

        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>



          <button type="button" onClick={saveCurrentMonth}>Save Month</button>
          <button type="button" onClick={clearCurrentMonth}>Clear Month</button>
          <button type="button" onClick={computeMetrics}>Calculate Metrics</button>
        </div>

        {/* <div style={{ marginTop: 16 }}>
          <h4>Tracked Months</h4>
          {Object.keys(cyclesMap).length === 0 && <div>No months saved yet.</div>}
          {Object.entries(cyclesMap).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <strong>{k}</strong>
              <div>Start: {v.start || '-'}</div>
              <div>End: {v.end || '-'}</div>
              <div>Intensity: {v.intensity || '-'}</div>
              <button type="button" onClick={() => { const [y, mo] = k.split('-').map(Number); setCurrentDate(new Date(y, mo - 1, 1)); }}>Edit</button>
              <button type="button" onClick={() => { setCyclesMap(prev => { const copy = { ...prev }; delete copy[k]; return copy; }); setTimeout(buildCyclesFromMap, 0); }}>Remove</button>
            </div>
          ))}
        </div>*/}
      </div>

      {/* Symptoms / Intensity Card */}
      <div className="period-intensity-card" style={{ background: 'white', border: '1px solid #eee', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <h4>Symptoms</h4>
        <div className="intensity-selector" style={{ marginTop: 8 }}>
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

      <form onSubmit={handleSubmit} className="analysis-form" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          <div className="form-group">
            <label htmlFor="AvgCycleLength">Average Cycle Length (days)</label>
            <input type="number" id="AvgCycleLength" name="AvgCycleLength" value={formData.AvgCycleLength} readOnly />
          </div>

          <div className="form-group">
            <label htmlFor="AvgCycleLengthPercent">Average Cycle Length (%)</label>
            <input type="number" id="AvgCycleLengthPercent" name="AvgCycleLengthPercent" value={formData.AvgCycleLengthPercent} readOnly />
          </div>

          <div className="form-group">
            <label htmlFor="IrregularCyclesPercent">Irregular Cycles Percentage</label>
            <input type="number" id="IrregularCyclesPercent" name="IrregularCyclesPercent" value={formData.IrregularCyclesPercent} readOnly />
            <small>Range: 0-100%</small>
          </div>

          <div className="form-group">
            <label htmlFor="StdCycleLength">Standard Deviation of Cycle Length</label>
            <input type="number" id="StdCycleLength" name="StdCycleLength" value={formData.StdCycleLength} readOnly />
            <small>Typical range: 0-10 days</small>
          </div>

          <div className="form-group">
            <label htmlFor="AvgLutealPhase">Average Luteal Phase Length (days)</label>
            <input type="number" id="AvgLutealPhase" name="AvgLutealPhase" value={formData.AvgLutealPhase} readOnly />
            <small>Typical range: 12-16 days</small>
          </div>

          <div className="form-group">
            <label htmlFor="ShortLutealPercent">Short Luteal Phase Percentage</label>
            <input type="number" id="ShortLutealPercent" name="ShortLutealPercent" value={formData.ShortLutealPercent} readOnly />
            <small>Range: 0-100% (blank = insufficient ovulation data)</small>
          </div>

          <div className="form-group">
            <label htmlFor="AvgBleedingIntensity">Average Bleeding Intensity (1-5)</label>
            <input type="number" id="AvgBleedingIntensity" name="AvgBleedingIntensity" value={formData.AvgBleedingIntensity} readOnly />
            <small>Range: 1 (light) to 5 (heavy)</small>
          </div>

          <div className="form-group">
            <label htmlFor="UnusualBleedingPercent">Unusual Bleeding Percentage</label>
            <input type="number" id="UnusualBleedingPercent" name="UnusualBleedingPercent" value={formData.UnusualBleedingPercent} readOnly />
            <small>Range: 0-100%</small>
          </div>

          <div className="form-group">
            <label htmlFor="AvgMensesLength">Average Menses Length (days)</label>
            <input type="number" id="AvgMensesLength" name="AvgMensesLength" value={formData.AvgMensesLength} readOnly />
            <small>Typical range: 3-7 days</small>
          </div>

          <div className="form-group">
            <label htmlFor="AvgOvulationDay">Average Ovulation Day</label>
            <input type="number" id="AvgOvulationDay" name="AvgOvulationDay" value={formData.AvgOvulationDay} readOnly />
            <small>Typical range: Day 11-21 of cycle</small>
          </div>

          <div className="form-group">
            <label htmlFor="OvulationVariability">Ovulation Variability (days)</label>
            <input type="number" id="OvulationVariability" name="OvulationVariability" value={formData.OvulationVariability} readOnly />
            <small>Typical range: 0-5 days</small>
          </div>

          <div className="form-group">
            <label htmlFor="Age">Age (years)</label>
            <input type="number" id="Age" name="Age" value={formData.Age} onChange={handleChange} required />
            <small>Range: 12-60 years</small>
          </div>

          <div className="form-group">
            <label htmlFor="BMI">BMI</label>
            <input type="number" id="BMI" name="BMI" value={formData.BMI} onChange={handleChange} required />
            <small>Typical range: 18.5-35</small>
          </div>

          <div className="form-group">
            <label htmlFor="TotalCycles">Total Cycles Tracked</label>
            <input type="number" id="TotalCycles" name="TotalCycles" value={formData.TotalCycles} readOnly />
            <small>Minimum: 3 cycles</small>
          </div>

          <div className="form-group">
            <label htmlFor="Numberpreg">Number of Pregnancies</label>
            <input type="number" id="Numberpreg" name="Numberpreg" value={formData.Numberpreg} onChange={handleChange} required />
            <small>Range: 0 or more</small>
          </div>

          <div className="form-group">
            <label htmlFor="Abortions">Number of Abortions</label>
            <input type="number" id="Abortions" name="Abortions" value={formData.Abortions} onChange={handleChange} required />
            <small>Range: 0 or more</small>
          </div>

          <div className="form-group">
            <label htmlFor="AgeM">Age at First Menstruation</label>
            <input type="number" id="AgeM" name="AgeM" value={formData.AgeM} onChange={handleChange} required />
            <small>Typical range: 9-16 years</small>
          </div>

          <div className="form-group">
            <label htmlFor="Breastfeeding">Currently Breastfeeding</label>
            <input type="checkbox" id="Breastfeeding" name="Breastfeeding" checked={formData.Breastfeeding} onChange={handleChange} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Health Data'}</button>
        </div>
      </form>

      {error && <div className="error-message" style={{ color: 'red', marginTop: 12 }}>{error}</div>}

      {results && (
        <div className="results-container" style={{ marginTop: 12 }}>
          <h3>Analysis Results</h3>
          {Object.entries(results).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '1em' }}>
              <strong>{key.replace('_', ' ').toUpperCase()}</strong>
              <pre style={{ background: '#f7f7f7', padding: 8, borderRadius: 6 }}>{JSON.stringify(value, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisForm;