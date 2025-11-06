import React from 'react';
import AnalysisForm from '../components/AnalysisForm';

const Calendar = () => (
  <div>
    <h2>Cycle Calendar &amp; Analysis</h2>
    {/* Re-using the existing AnalysisForm component */}
    <AnalysisForm />
  </div>
);

export default Calendar;