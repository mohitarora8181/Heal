import { motion } from "framer-motion";
import { Calendar, Users, MessageCircle, Activity, Clock } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Avatar } from "../../components/common/Avatar";
import { useAuth } from "../../auth/AuthContext";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Define interfaces for type safety
interface Patient {
  _id: string;
  name: string;
  email: string;
  role: string;
  patientDetails?: {
    medicalHistory?: string;
  };
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  time?: string;
  type: string;
  isUrgent: boolean;
  status: string;
  patient?: {
    _id: string;
    name: string;
    email: string;
  };
}

export const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for fetched data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [stats, setStats] = useState({
    satisfaction: "95%",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?._id) return;

      setLoading(true);
      setError(null);

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const token = localStorage.getItem("healToken");

        if (!token) {
          throw new Error("Authentication required");
        }

        // Fetch appointments
        const appointmentsPromise = fetch(
          `${backendUrl}/appointments/${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ).then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch appointments");
          }
          return response.json();
        });

        // Fetch patients
        const patientsPromise = fetch(
          `${backendUrl}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ).then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch patients");
          }
          return response.json();
        });

        const unreadMessagesPromise = Promise.resolve(0);

        const [appointmentsData, { users }, unreadMessagesCount] =
          await Promise.all([appointmentsPromise, patientsPromise, unreadMessagesPromise]);

        const enhancedAppointments = appointmentsData.map((appointment: Appointment) => {
          return {
            ...appointment,
            patient: appointment.patientId
          };
        });

        setAppointments(enhancedAppointments);
        setPatients(users.filter((u: any) => u.role == "patient"));
        setUnreadMessages(unreadMessagesCount);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?._id]);

  if (!currentUser || currentUser.role !== "doctor") {
    return <div>Unauthorized</div>;
  }

  // Filter today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysAppointments = appointments
    .filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate.getTime() === today.getTime();
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {currentUser.name}
        </h1>
        <p className="text-gray-600 mt-1">Here's your practice overview</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
          <p className="text-error-700">{error}</p>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-primary-100 p-3 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {todaysAppointments.length}
              </h2>
              <p className="text-gray-600 mt-1">Today's Appointments</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-secondary-100 p-3 rounded-full mb-3">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {patients.length}
              </h2>
              <p className="text-gray-600 mt-1">Active Patients</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-accent-100 p-3 rounded-full mb-3">
                <MessageCircle className="h-6 w-6 text-accent-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">{unreadMessages}</h2>
              <p className="text-gray-600 mt-1">Unread Messages</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-success-50 p-3 rounded-full mb-3">
                <Activity className="h-6 w-6 text-success-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">{stats.satisfaction}</h2>
              <p className="text-gray-600 mt-1">Patient Satisfaction</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Today's Schedule
              </h2>
              <Link to="/doctor/appointments">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todaysAppointments.length > 0 ? (
                <div className="space-y-4">
                  {todaysAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      {appointment.patient && (
                        <Avatar
                          user={{ ...(appointment.patient), role: "patient" }}
                          size="md"
                          className="mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {appointment.patient?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.type.charAt(0).toUpperCase() +
                            appointment.type.slice(1)}{" "}
                          Consultation
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end mb-1">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(appointment.date), "h:mm a")}
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm text-gray-600">
                            {appointment.duration} minutes
                          </span>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <Badge
                            variant={
                              appointment.status === 'confirmed' ? 'success' :
                                appointment.status === 'pending' ? 'warning' :
                                  appointment.status === 'cancelled' ? 'error' : 'secondary'
                            }
                          >
                            {appointment.status && appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                        {appointment.isUrgent && (
                          <Badge variant="error" className="mt-2">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">
                    No appointments scheduled for today
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Patients
              </h2>
              <Link to="/doctor/patients">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patients.length > 0 ? (
                <div className="space-y-4">
                  {patients.slice(0, 5).map((patient) => (
                    <div key={patient._id} className="flex items-center">
                      <Avatar user={patient} size="md" className="mr-3" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {patient.patientDetails?.medicalHistory || "No medical history"}
                        </p>
                      </div>
                      <Link to={`/doctor/patients/${patient._id}`}>
                        <Button size="sm" variant="ghost" className="ml-auto">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No patients found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
};
