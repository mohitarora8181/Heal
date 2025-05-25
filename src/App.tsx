import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { Appointments } from "./pages/patient/Appointments";
import { FindDoctors } from "./pages/patient/FindDoctors";
import { Messages } from "./pages/patient/Messages";
import { DoctorAppointments } from "./pages/doctor/Appointments";
import { DoctorPatients } from "./pages/doctor/Patients";
import { DoctorMessages } from "./pages/doctor/Messages";
import { DoctorPrescriptions } from "./pages/doctor/Prescriptions";
import { DoctorPayments } from "./pages/doctor/Payments";
import RoomPage from "./pages/videoconf/RoomPage";
import EnterRoomId from "./pages/videoconf/EnterRoomId";
import { Prescriptions } from "./pages/patient/Prescriptions";
import { Records } from "./pages/patient/Records";
import { Payments } from "./pages/patient/Payments";
import { AppointmentWaiting } from "./pages/videoconf/WaitingRoom";
import { PatientProfile } from "./pages/patient/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={<ProtectedRoute allowedRole="patient" />}
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="find-doctors" element={<FindDoctors />} />
            <Route path="messages" element={<Messages />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="records" element={<Records />} />
            <Route path="payments" element={<Payments />} />
          </Route>

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={<ProtectedRoute allowedRole="doctor" />}
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:patientId" element={<PatientProfile />} />
            <Route path="messages" element={<DoctorMessages />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="payments" element={<DoctorPayments />} />
            {/* Add more doctor routes here as needed */}
          </Route>

          {/* Video Conference Route */}
          <Route path="/EnterRoom" element={<EnterRoomId />} />
          <Route path="/videoconf/:roomId" element={<RoomPage />} />
          <Route path="/waiting-room" element={<AppointmentWaiting />} />

          {/* Default/Fallback Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
