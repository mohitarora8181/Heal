import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PatientDashboard } from './pages/patient/Dashboard';
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { Appointments } from './pages/patient/Appointments';
import { FindDoctors } from './pages/patient/FindDoctors';
import { Messages } from './pages/patient/Messages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes */}
          <Route path="/patient" element={<ProtectedRoute allowedRole="patient" />}>
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="find-doctors" element={<FindDoctors />} />
            <Route path="messages" element={<Messages />} />
          </Route>

          {/* Doctor Routes */}
          <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor" />}>
            <Route path="dashboard" element={<DoctorDashboard />} />
            {/* Add more doctor routes here as needed */}
          </Route>

          {/* Default/Fallback Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;