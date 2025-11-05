import React, { useState, useEffect } from 'react';
import '../styles/AnalysisForm.css';

// Helper to calculate difference in days between two ISO date strings
const diffInDays = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(end) - new Date(start);
  return Math.round(diff / msPerDay);
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const AnalysisForm = () => {
  // stored cycles keyed by month (YYYY-MM) — each entry { start, end, intensity }
  const [cyclesMap, setCyclesMap] = useState({});
  // derived sorted cycles array used for metrics
  const [cycles, setCycles] = useState([]);

  // calendar state (visible month + temporary selection for editing)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [tempIntensity, setTempIntensity] = useState('');

  // metrics & form values
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

  // when visible month changes, populate temp fields from cyclesMap if present
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

  // build sorted cycles array from cyclesMap
  const buildCyclesFromMap = () => {
    const arr = Object.entries(cyclesMap).map(([month, obj]) => ({ month, ...obj }));
    arr.sort((a, b) => {
      if (a.start && b.start) return new Date(a.start) - new Date(b.start);
      return a.month.localeCompare(b.month);
    });
    setCycles(arr);
    return arr;
  };

  // Save currently edited month's selection into cyclesMap
  const saveCurrentMonth = () => {
    const key = getMonthKey(currentDate);
    setCyclesMap(prev => ({ ...prev, [key]: { start: tempStart, end: tempEnd, intensity: tempIntensity } }));
    // update derived list
    setTimeout(buildCyclesFromMap, 0);
  };

  const clearCurrentMonth = () => {
    const key = getMonthKey(currentDate);
    setCyclesMap(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    setTempStart(''); setTempEnd(''); setTempIntensity('');
    setTimeout(buildCyclesFromMap, 0);
  };

  // Clicking a day toggles start/end like a simple date-range picker
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
        // clicked before start -> make new start
        setTempStart(iso);
        setTempEnd('');
      }
      return;
    }
    // both set -> start a new selection
    setTempStart(iso);
    setTempEnd('');
  };

  // month navigation
  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  // CORE: compute metrics using the requested formulas and robust guarding
  const computeMetrics = () => {
    const arr = buildCyclesFromMap();
    // Consider only months with both start and end defined
    const completed = arr.filter(c => c.start && c.end);

    if (completed.length < 2) {
      alert('Please enter at least 2 complete cycles to calculate metrics');
      return;
    }

    // --- Cycle lengths between starts (days) ---
    const L = [];
    for (let i = 0; i < completed.length - 1; i++) {
      L.push(diffInDays(completed[i].start, completed[i + 1].start));
    }

    // Basic stats: average cycle length
    const avgCycle = L.reduce((a, b) => a + b, 0) / L.length;

    // Percent relative to average
    const P = L.map(li => (li / avgCycle) * 100);
    const avgPercent = P.reduce((a, b) => a + b, 0) / P.length;

    // --- Standard deviation (sample: divide by n-1) ---
    const stdCycle = L.length > 1
      ? Math.sqrt(L.reduce((sum, li) => sum + Math.pow(li - avgCycle, 2), 0) / (L.length - 1))
      : 0;

    // --- Menses lengths (inclusive: +1) ---
    const M = completed.map(c => diffInDays(c.start, c.end) + 1);
    const avgMenses = M.reduce((a, b) => a + b, 0) / M.length;

    // --- Luteal & ovulation (assumed luteal used for ovulation estimate) ---
    const assumedLuteal = 14;
    const ovDays = L.map(li => li - assumedLuteal);
    const avgOvDay = ovDays.reduce((a, b) => a + b, 0) / ovDays.length;
    const ovVar = ovDays.length > 1
      ? Math.sqrt(ovDays.reduce((sum, v) => sum + Math.pow(v - avgOvDay, 2), 0) / (ovDays.length - 1))
      : 0;

    // --- Irregular cycles percentage ---
    // Cycle is irregular if |li - avgCycle| >= irregularThreshold
    const irregularThreshold = 7;
    const irregularCount = L.filter(li => Math.abs(li - avgCycle) >= irregularThreshold).length;
    const irregularPercent = L.length > 0 ? (irregularCount / L.length) * 100 : 0;

    // --- Short luteal phase percentage (estimated per-cycle luteal length) ---
    // We estimate luteal length per cycle as:
    //    luteal_i = L[i] - follicular_interval_i
    // where follicular_interval_i = days between end-of-menses for cycle i and next cycle's start.
    // This yields a per-cycle estimate (more meaningful than assuming a fixed luteal for all cycles).
    const lutealEstimates = [];
    for (let i = 0; i < completed.length - 1; i++) {
      const cycleStart = completed[i].start;
      const cycleEnd = completed[i].end;
      const nextStart = completed[i + 1].start;
      const cycleLen = diffInDays(cycleStart, nextStart); // same as L[i]
      // days after menses end until next period start (approx follicular interval)
      const follicularInterval = diffInDays(cycleEnd, nextStart);
      const lutealEstimate = cycleLen - follicularInterval;
      // Only accept reasonable numeric values
      if (Number.isFinite(lutealEstimate)) lutealEstimates.push(lutealEstimate);
    }
    const shortLutealThreshold = 11;
    const shortCount = lutealEstimates.filter(l => l < shortLutealThreshold).length;
    const shortLutealPercent = lutealEstimates.length > 0
      ? (shortCount / lutealEstimates.length) * 100
      : 0;

    // --- Bleeding intensity & unusual bleeding ---
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

    // Update form data with formatting matching your original code (1 decimal)
    setFormData(prev => ({
      ...prev,
      AvgCycleLength: Number.isFinite(avgCycle) ? avgCycle.toFixed(1) : '',
      AvgCycleLengthPercent: Number.isFinite(avgPercent) ? avgPercent.toFixed(1) : '',
      StdCycleLength: Number.isFinite(stdCycle) ? stdCycle.toFixed(1) : '',
      AvgMensesLength: Number.isFinite(avgMenses) ? avgMenses.toFixed(1) : '',
      TotalCycles: completed.length,
      AvgLutealPhase: assumedLuteal,
      AvgOvulationDay: Number.isFinite(avgOvDay) ? avgOvDay.toFixed(1) : '',
      IrregularCyclesPercent: Number.isFinite(irregularPercent) ? irregularPercent.toFixed(1) : '',
      ShortLutealPercent: Number.isFinite(shortLutealPercent) ? shortLutealPercent.toFixed(1) : '',
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
      // send formData plus raw cycles to backend (include derived cycles for transparency)
      const features = { ...formData, cycles: buildCyclesFromMap() };
      const response = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      const data = await response.json();
      setResults(data.results || data);
    } catch (err) {
      setError('Failed to analyze data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // calendar grid generation (7 columns x 6 rows = 42 cells)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  const totalDays = daysInMonth(year, month);

  // previous month info for leading days
  const prevMonthLastDay = new Date(year, month, 0); // last day of prev month
  const prevDays = prevMonthLastDay.getDate();
  const prevYear = prevMonthLastDay.getFullYear();
  const prevMonthIndex = prevMonthLastDay.getMonth();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstWeekday + 1;
    let cellDate, inCurrentMonth;
    if (dayNum <= 0) {
      // previous month day
      const d = prevDays + dayNum;
      cellDate = new Date(prevYear, prevMonthIndex, d);
      inCurrentMonth = false;
    } else if (dayNum > totalDays) {
      // next month day
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
    <div className="analysis-form-container" style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h2 style={{ textAlign: 'center' }}>Menstrual Health Analysis — Monthly Calendar</h2>

      <div className="period-tracker" style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: 'white' }}>
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
          <label>Selected Start:
            <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} style={{ marginLeft: 8 }} />
          </label>

          <label>Selected End:
            <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)} style={{ marginLeft: 8 }} />
          </label>

          <label>Intensity (1-5):
            <input type="number" min="1" max="5" value={tempIntensity} onChange={e => setTempIntensity(e.target.value)} placeholder="1-5" style={{ marginLeft: 8, width: 70 }} />
          </label>

          <button type="button" onClick={saveCurrentMonth}>Save Month</button>
          <button type="button" onClick={clearCurrentMonth}>Clear Month</button>
          <button type="button" onClick={computeMetrics}>Calculate Metrics</button>
        </div>

        <div style={{ marginTop: 16 }}>
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
        </div>
      </div>

      {/* Metrics + demographic form (keeps your original fields & display) */}
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
            <small>Range: 0-100%</small>
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