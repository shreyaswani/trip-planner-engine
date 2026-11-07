import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import { Loader2 } from 'lucide-react';

// We will build these components in Phase 2 & 4
import PhoneLogin from './features/auth/PhoneLogin';
import Dashboard from './features/trips/Dashboard';
import TripPlannerDashboard from './features/planner/TripPlannerDashboard';
import TripExpenseTracker from './features/planner/TripExpenseTracker';

export default function App() {
  const { user, isLoading, initializeAuthListener } = useAuthStore();

  // Boot up the Firebase listener on app load
  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* If user is already logged in, redirect them away from the login screen to the dashboard */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <PhoneLogin />} 
        />
        
        {/* Protected Route: If no user is logged in, kick them back to /login */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
<Route 
  path="/trip/:tripId" 
  element={user ? <TripPlannerDashboard /> : <Navigate to="/login" replace />} 
/>
<Route 
  path="/trip/:tripId/expenses" 
  element={user ? <TripExpenseTracker /> : <Navigate to="/login" replace />} 
/>

        {/* Default catch-all */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}