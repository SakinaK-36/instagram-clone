// import React from 'react';
import type { ReactNode } from 'react';
import './theme.css';
import './instagram.css';
import './App.css';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { DirectMessages } from './pages/DirectMessages';
import { Notifications } from './pages/Notifications';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Login-protected page inside the main layout
const Page = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-shell">
            <ThemeToggle />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={<Page><Home /></Page>} />
              <Route path="/profile/:username" element={<Page><Profile /></Page>} />
              <Route path="/notifications" element={<Page><Notifications /></Page>} />
              <Route path="/direct" element={<Page><DirectMessages /></Page>} />
              <Route path="/direct/:userId" element={<Page><DirectMessages /></Page>} />

              {/* Unknown URLs go home (or to login if logged out) */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;