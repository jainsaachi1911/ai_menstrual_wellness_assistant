import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class TopLevelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {}
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#222', color: '#fff', padding: 48, zIndex: 9999 }}>
          <h1>Something went wrong in the App.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TopLevelErrorBoundary>
      <App />
    </TopLevelErrorBoundary>
  </StrictMode>,
)
