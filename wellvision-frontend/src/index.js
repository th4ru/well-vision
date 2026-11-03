import React, { Suspense, lazy, Component } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

// AuthProvider
import { AuthProvider } from './context/AuthContext'; // adjust path if needed

// Redux
import { Provider } from "react-redux";
import { store } from "./admin/state/store";

// Lazy load App
const App = lazy(() => import('./App'));

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Provider store={store}> {/* ✅ Wrap App with Redux Provider */}
          <AuthProvider>  {/* ✅ Then wrap with AuthProvider */}
            <App />
          </AuthProvider>
        </Provider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

// Web Vitals
function sendToAnalytics(metric) {
  console.log('Web Vitals:', metric);
}
reportWebVitals(sendToAnalytics);
