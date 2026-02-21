
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LockerProvider } from './context/LockerContext';
import { supabase } from './supabaseClient';
import AdminPanel from './components/AdminPanel';
import PublicPanel from './components/PublicPanel';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <LockerProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<PublicPanel />} />
            <Route
              path="/login"
              element={!session ? <Login /> : <Navigate to="/admin" replace />}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute session={session}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            {/* Catch all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </LockerProvider>
  );
}

export default App;
