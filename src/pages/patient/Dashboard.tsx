import { motion } from "framer-motion";
import { Calendar, Clock, Activity, Pill, Heart, Plus } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Avatar } from "../../components/common/Avatar";
import { useAuth } from "../../auth/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Define interfaces for type safety
interface Doctor {
  _id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: Doctor;
  date: string;
  duration: number;
  isUrgent: boolean;
  type: string;
  status: string;
}

interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  date: string;
  refillable: boolean;
  refills: number;
  isActive?: boolean;
}

export const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<number>(0);
  const [medicalRecords, setMedicalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(85);

  useEffect(() => {
    if (!currentUser?._id) return;

    // Set up fetch requests
    const fetchData = async () => {
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
          if (!response.ok) throw new Error("Failed to fetch appointments");
          return response.json();
        });

        // Fetch prescriptions
        const prescriptionsPromise = fetch(
          `${backendUrl}/prescriptions?userRole=patient&userId=${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ).then(response => {
          if (!response.ok) throw new Error("Failed to fetch prescriptions");
          return response.json();
        });

        // Fetch medical records
        const recordsPromise = fetch(
          `${backendUrl}/medical-records/${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ).then(response => {
          if (!response.ok) throw new Error("Failed to fetch medical records");
          return response.json();
        });

        // Fetch patient details for vitals
        const patientDetailsPromise = fetch(
          `${backendUrl}/users/${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        ).then(response => {
          if (!response.ok) throw new Error("Failed to fetch patient details");
          return response.json();
        });

        // Execute all promises concurrently
        const [appointmentsData, prescriptionsData, recordsData, patientData] =
          await Promise.all([appointmentsPromise, prescriptionsPromise, recordsPromise, patientDetailsPromise]);

        setAppointments(appointmentsData);

        // Get active prescriptions (not expired)
        const activePrescriptionsCount = prescriptionsData.filter((p: Prescription) => {
          // Consider a prescription active if it has refills or was prescribed within the last 30 days
          const prescriptionDate = new Date(p.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return p.refillable && p.refills > 0 || prescriptionDate > thirtyDaysAgo;
        }).length;

        setActivePrescriptions(activePrescriptionsCount);
        setMedicalRecords(recordsData.length);

        // Extract heart rate from patient details if available
        if (patientData.patientDetails?.vitals?.heartRate) {
          const heartRateValue = parseInt(patientData.patientDetails.vitals.heartRate);
          if (!isNaN(heartRateValue)) {
            setHeartRate(heartRateValue);
          }
        }

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?._id]);

  // Early return for unauthorized users
  if (!currentUser || currentUser.role !== "patient") {
    return (
      <PageLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600">You must be logged in as a patient to view this dashboard.</p>
          <Button className="mt-4" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Filter upcoming appointments for the current patient
  const upcomingTotalAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate > new Date();
    })
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const upcomingAppointments = upcomingTotalAppointments.slice(0, 3);

  // Enhance appointments with doctor data
  const appointmentDoctors = upcomingAppointments.map((appointment) => ({
    appointment,
    doctor: appointment.doctorId,
  }));

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Item animation
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
        <p className="text-gray-600 mt-1">Here's an overview of your health</p>
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
                {upcomingTotalAppointments.length}
              </h2>
              <p className="text-gray-600 mt-1">Upcoming Appointments</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-secondary-100 p-3 rounded-full mb-3">
                <Pill className="h-6 w-6 text-secondary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {activePrescriptions}
              </h2>
              <p className="text-gray-600 mt-1">Active Prescriptions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-accent-100 p-3 rounded-full mb-3">
                <Activity className="h-6 w-6 text-accent-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {medicalRecords}
              </h2>
              <p className="text-gray-600 mt-1">Health Records</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-error-50 p-3 rounded-full mb-3">
                <Heart className="h-6 w-6 text-error-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">
                {heartRate || '—'}
              </h2>
              <p className="text-gray-600 mt-1">
                {heartRate ? 'Heart Rate (bpm)' : 'Heart Rate Not Available'}
              </p>
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
                Upcoming Appointments
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/patient/appointments`)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentDoctors.length > 0 ? (
                <div className="space-y-4">
                  {appointmentDoctors.map(({ appointment, doctor }) => (
                    <div
                      key={appointment._id}
                      className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      {doctor && (
                        <Avatar user={doctor} size="md" className="mr-4" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {doctor?.name || "Doctor"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {doctor?.specialization || "Healthcare Professional"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end mb-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(appointment.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {format(new Date(appointment.date), "h:mm a")}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge
                            variant={appointment.type === 'video' ? 'primary' : 'secondary'}
                          >
                            {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                          </Badge>
                          {appointment.isUrgent && (
                            <Badge variant="error" className="ml-2">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500 mb-4">No upcoming appointments</p>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/patient/find-doctors`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule New
                  </Button>
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
                Health Tips
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-bold text-primary-800 mb-2">
                    Stay Hydrated 💧
                  </h3>
                  <p className="text-sm font-semibold text-gray-600">
                    Drink at least 8 glasses of water daily to maintain proper
                    bodily functions.
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <h3 className="font-bold text-secondary-800 mb-2">
                    Regular Exercise 🚴‍♂️
                  </h3>
                  <p className="text-sm font-semibold text-gray-600">
                    Aim for at least 30 minutes of moderate exercise 5 days a
                    week.
                  </p>
                </div>
                <div className="p-4 bg-accent-50 rounded-lg">
                  <h3 className="font-bold text-accent-800 mb-2">
                    Healthy Sleep 🛌
                  </h3>
                  <p className="text-sm font-semibold text-gray-600">
                    Aim for 7-9 hours of quality sleep each night to support
                    mental and physical health.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
};
