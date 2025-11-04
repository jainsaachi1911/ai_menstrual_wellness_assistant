import { useState } from 'react';
import '../styles/AnalysisForm.css';

const AnalysisForm = () => {
  const [formData, setFormData] = useState({
    AvgCycleLength: '',
    IrregularCyclesPercent: '',
    StdCycleLength: '',
    AvgLutealPhase: '',
    ShortLutealPercent: '',
    AvgBleedingIntensity: '',
    UnusualBleedingPercent: '',
    AvgMensesLength: '',
    AvgOvulationDay: '',
    OvulationVariability: '',
    Age: '',
    BMI: '',
    TotalCycles: '',
    Numberpreg: '',
    Abortions: '',
    AgeM: '',
    Breastfeeding: false
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="analysis-form-container">
      <h2>Menstrual Health Analysis Form</h2>
      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="form-group">
          <label htmlFor="AvgCycleLength">Average Cycle Length (days)</label>
          <input
            type="number"
            id="AvgCycleLength"
            name="AvgCycleLength"
            value={formData.AvgCycleLength}
            onChange={handleChange}
            required
          />
          <small>Typical range: 21-35 days</small>
        </div>

        <div className="form-group">
          <label htmlFor="IrregularCyclesPercent">Irregular Cycles Percentage</label>
          <input
            type="number"
            id="IrregularCyclesPercent"
            name="IrregularCyclesPercent"
            value={formData.IrregularCyclesPercent}
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            min="1"
            max="5"
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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
            onChange={handleChange}
            required
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