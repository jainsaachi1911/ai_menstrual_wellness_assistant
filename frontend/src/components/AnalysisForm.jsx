import { useState } from 'react';
import '../styles/AnalysisForm.css';

// Helper to calculate difference in days between two ISO date strings
const diffInDays = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(end) - new Date(start);
  return Math.round(diff / msPerDay);
};

const AnalysisForm = () => {
  const [cycles, setCycles] = useState([
    { start: '', end: '', intensity: '' } // add intensity per-cycle
  ]);

  const [formData, setFormData] = useState({
    AvgCycleLength: '',
    AvgCycleLengthPercent: '',
    StdCycleLength: '',
    AvgMensesLength: '',
    TotalCycles: '',
    AvgLutealPhase: '',
    AvgOvulationDay: '',
    // existing fields below (retain if needed by backend)
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

  // Calculate metrics based on cycles array
  const computeMetrics = () => { 
    const completed = cycles.filter(c => c.start && c.end); 
    if (completed.length < 2) { 
      alert('Please enter at least 2 complete cycles to calculate metrics'); 
      return; 
    } 
 
    // --- Cycle lengths between starts (days) --- 
    const L = []; 
    for (let i = 0; i < completed.length - 1; i++) { 
      L.push(diffInDays(completed[i].start, completed[i + 1].start)); 
    } 
 
    // Basic stats 
    const avgCycle = L.reduce((a, b) => a + b, 0) / L.length; 
    const P = L.map(li => (li / avgCycle) * 100); 
    const avgPercent = P.reduce((a, b) => a + b, 0) / P.length; 
 
    // NOTE: use sample std dev with (n-1) denominator 
    const stdCycle = L.length > 1 
      ? Math.sqrt(L.reduce((sum, li) => sum + Math.pow(li - avgCycle, 2), 0) / (L.length - 1)) 
      : 0; 
 
    // Menses lengths (include last day -> +1) 
    const M = completed.map(c => diffInDays(c.start, c.end) + 1); 
    const avgMenses = M.reduce((a, b) => a + b, 0) / M.length; 
 
    // Luteal assumptions and ovulation estimates 
    const assumedLuteal = 14; // fixed assumption for now 
    const ovDays = L.map(li => li - assumedLuteal); 
    const avgOvDay = ovDays.reduce((a, b) => a + b, 0) / ovDays.length; 
    const ovVar = ovDays.length > 1 
      ? Math.sqrt(ovDays.reduce((sum, v) => sum + Math.pow(v - avgOvDay, 2), 0) / (ovDays.length - 1)) 
      : 0; 
 
    // Irregular cycles percentage 
    const irregularThreshold = 7; 
    const irregularCount = L.filter(li => Math.abs(li - avgCycle) >= irregularThreshold).length; 
    const irregularPercent = (irregularCount / L.length) * 100; 
 
    // Short luteal phase percentage (heuristic with assumed luteal) 
    const shortLutealThreshold = 11; 
    const lutealPerCycle = L.map(() => assumedLuteal); 
    const shortCount = lutealPerCycle.filter(lut => lut < shortLutealThreshold).length; 
    const shortLutealPercent = (shortCount / lutealPerCycle.length) * 100; 

    // ----------------------------
    // Bleeding intensity & unusual bleeding
    // ----------------------------
    // Compute average intensity: consider only cycles where intensity is numeric (1-5)
    const intensityValues = completed
      .map(c => {
        const v = Number(c.intensity);
        return (Number.isFinite(v) && v >= 1 && v <= 5) ? v : null;
      })
      .filter(v => v !== null);

    const avgIntensity = intensityValues.length > 0
      ? intensityValues.reduce((a,b) => a + b, 0) / intensityValues.length
      : 0;

    // Unusual bleeding: we mark a cycle unusual if
    //  - intensity >= 4 (heavy), OR
    //  - menses length outside typical 3-7 days
    const unusualCount = completed.reduce((count, c, idx) => {
      const mLen = diffInDays(c.start, c.end) + 1;
      const intVal = Number(c.intensity);
      const heavy = Number.isFinite(intVal) && intVal >= 4;
      const unusualDuration = (mLen < 3 || mLen > 7);
      return count + ((heavy || unusualDuration) ? 1 : 0);
    }, 0);

    const unusualPercent = (unusualCount / completed.length) * 100;

    // Update form data 
    setFormData(prev => ({ 
      ...prev, 
      AvgCycleLength: avgCycle.toFixed(1), 
      AvgCycleLengthPercent: avgPercent.toFixed(1), 
      StdCycleLength: stdCycle.toFixed(1), 
      AvgMensesLength: avgMenses.toFixed(1), 
      TotalCycles: completed.length, 
      AvgLutealPhase: assumedLuteal, 
      AvgOvulationDay: avgOvDay.toFixed(1), 
      IrregularCyclesPercent: irregularPercent.toFixed(1), 
      ShortLutealPercent: shortLutealPercent.toFixed(1), 
      OvulationVariability: ovVar.toFixed(1),
      AvgBleedingIntensity: avgIntensity > 0 ? avgIntensity.toFixed(1) : '',
      UnusualBleedingPercent: unusualPercent.toFixed(1)
    })); 
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send all form data as 'features' key for backend compatibility
      const response = await fetch('http://localhost:5002/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features: formData }),
      });

      const data = await response.json();
      setResults(data.results || data); // Display only the 'results' object
    } catch (err) {
      setError('Failed to analyze data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // helper to update a cycle property
  const updateCycle = (idx, prop, val) => {
    setCycles(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [prop]: val };
      return updated;
    });
  };

  return (
    <div className="analysis-form-container">
      <h2>Menstrual Health Analysis Form</h2>
      {/* Period Tracker Section */}
      <div className="period-tracker">
        <h3>Period Tracker</h3>
        {cycles.map((cycle, idx) => (
          <div key={idx} className="cycle-row">
            <label>
              Cycle {idx + 1} Start:
              <input
                type="date"
                value={cycle.start}
                onChange={e => updateCycle(idx, 'start', e.target.value)}
                required
              />
            </label>
            <label>
              End:
              <input
                type="date"
                value={cycle.end}
                onChange={e => updateCycle(idx, 'end', e.target.value)}
                required
              />
            </label>
            <label>
              Bleeding intensity (1-5):
              <input
                type="number"
                min="1"
                max="5"
                value={cycle.intensity}
                onChange={e => updateCycle(idx, 'intensity', e.target.value)}
                placeholder="1-5"
              />
            </label>
          </div>
        ))}
        <button type="button" onClick={() => setCycles(prev => [...prev, { start: '', end: '', intensity: '' }])}>
          + Add Period
        </button>
        <button type="button" style={{ marginLeft: 12 }} onClick={() => computeMetrics()}>
          Calculate Metrics
        </button>
      </div>

      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="form-group">
          <label htmlFor="AvgCycleLength">Average Cycle Length (days)</label>
          <input
            type="number"
            id="AvgCycleLength"
            name="AvgCycleLength"
            value={formData.AvgCycleLength}
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="AvgCycleLengthPercent">Average Cycle Length (%)</label>
          <input
            type="number"
            id="AvgCycleLengthPercent"
            name="AvgCycleLengthPercent"
            value={formData.AvgCycleLengthPercent}
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="IrregularCyclesPercent">Irregular Cycles Percentage</label>
          <input
            type="number"
            id="IrregularCyclesPercent"
            name="IrregularCyclesPercent"
            value={formData.IrregularCyclesPercent}
            readOnly
          />
          <small>Range: 0-100%</small>
        </div>

        <div className="form-group">
          <label htmlFor="StdCycleLength">Standard Deviation of Cycle Length</label>
          <input
            type="number"
            id="StdCycleLength"
            name="StdCycleLength"
            value={formData.StdCycleLength}
            readOnly
          />
          <small>Typical range: 0-10 days</small>
        </div>

        <div className="form-group">
          <label htmlFor="AvgLutealPhase">Average Luteal Phase Length (days)</label>
          <input
            type="number"
            id="AvgLutealPhase"
            name="AvgLutealPhase"
            value={formData.AvgLutealPhase}
            readOnly
          />
          <small>Typical range: 12-16 days</small>
        </div>

        <div className="form-group">
          <label htmlFor="ShortLutealPercent">Short Luteal Phase Percentage</label>
          <input
            type="number"
            id="ShortLutealPercent"
            name="ShortLutealPercent"
            value={formData.ShortLutealPercent}
            readOnly
          />
          <small>Range: 0-100%</small>
        </div>

        <div className="form-group">
          <label htmlFor="AvgBleedingIntensity">Average Bleeding Intensity (1-5)</label>
          <input
            type="number"
            id="AvgBleedingIntensity"
            name="AvgBleedingIntensity"
            value={formData.AvgBleedingIntensity}
            readOnly
          />
          <small>Range: 1 (light) to 5 (heavy)</small>
        </div>

        <div className="form-group">
          <label htmlFor="UnusualBleedingPercent">Unusual Bleeding Percentage</label>
          <input
            type="number"
            id="UnusualBleedingPercent"
            name="UnusualBleedingPercent"
            value={formData.UnusualBleedingPercent}
            readOnly
          />
          <small>Range: 0-100%</small>
        </div>

        <div className="form-group">
          <label htmlFor="AvgMensesLength">Average Menses Length (days)</label>
          <input
            type="number"
            id="AvgMensesLength"
            name="AvgMensesLength"
            value={formData.AvgMensesLength}
            readOnly
          />
          <small>Typical range: 3-7 days</small>
        </div>

        <div className="form-group">
          <label htmlFor="AvgOvulationDay">Average Ovulation Day</label>
          <input
            type="number"
            id="AvgOvulationDay"
            name="AvgOvulationDay"
            value={formData.AvgOvulationDay}
            readOnly
          />
          <small>Typical range: Day 11-21 of cycle</small>
        </div>

        <div className="form-group">
          <label htmlFor="OvulationVariability">Ovulation Variability (days)</label>
          <input
            type="number"
            id="OvulationVariability"
            name="OvulationVariability"
            value={formData.OvulationVariability}
            readOnly
          />
          <small>Typical range: 0-5 days</small>
        </div>

        <div className="form-group">
          <label htmlFor="Age">Age (years)</label>
          <input
            type="number"
            id="Age"
            name="Age"
            value={formData.Age}
            onChange={handleChange}
            required
          />
          <small>Range: 12-60 years</small>
        </div>

        <div className="form-group">
          <label htmlFor="BMI">BMI</label>
          <input
            type="number"
            id="BMI"
            name="BMI"
            value={formData.BMI}
            onChange={handleChange}
            required
          />
          <small>Typical range: 18.5-35</small>
        </div>

        <div className="form-group">
          <label htmlFor="TotalCycles">Total Cycles Tracked</label>
          <input
            type="number"
            id="TotalCycles"
            name="TotalCycles"
            value={formData.TotalCycles}
            readOnly
          />
          <small>Minimum: 3 cycles</small>
        </div>

        <div className="form-group">
          <label htmlFor="Numberpreg">Number of Pregnancies</label>
          <input
            type="number"
            id="Numberpreg"
            name="Numberpreg"
            value={formData.Numberpreg}
            onChange={handleChange}
            required
          />
          <small>Range: 0 or more</small>
        </div>

        <div className="form-group">
          <label htmlFor="Abortions">Number of Abortions</label>
          <input
            type="number"
            id="Abortions"
            name="Abortions"
            value={formData.Abortions}
            onChange={handleChange}
            required
          />
          <small>Range: 0 or more</small>
        </div>

        <div className="form-group">
          <label htmlFor="AgeM">Age at First Menstruation</label>
          <input
            type="number"
            id="AgeM"
            name="AgeM"
            value={formData.AgeM}
            onChange={handleChange}
            required
          />
          <small>Typical range: 9-16 years</small>
        </div>

        <div className="form-group">
          <label htmlFor="Breastfeeding">Currently Breastfeeding</label>
          <input
            type="checkbox"
            id="Breastfeeding"
            name="Breastfeeding"
            checked={formData.Breastfeeding}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Health Data'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      {results && (
        <div className="results-container">
          <h3>Analysis Results</h3>
          {/* Show each model's result if available */}
          {Object.entries(results).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '1em' }}>
              <strong>{key.replace('_', ' ').toUpperCase()}</strong>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisForm;