import { motion } from "framer-motion";
import { Calendar, Clock, Activity, Pill, Heart, Plus } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Avatar } from "../../components/common/Avatar";
import { useAuth } from "../../auth/AuthContext";
import { mockDoctors } from "../../../dummyData";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== "patient") {
    return <div>Unauthorized</div>;
  }

  const [appointments, setAppointments] = useState<any[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/appointments/${currentUser._id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        const data = await response.json();
        console.log("Fetched appointments:", data);
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || "Error fetching appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();

    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/prescriptions/${currentUser._id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch prescriptions");
        }
        const data = await response.json();
        console.log("Fetched prescriptions:", data);
        setActivePrescriptions(data.filter((p: any) => p.isActive));
      } catch (err: any) {
        setError(err.message || "Error fetching prescriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [currentUser._id]);

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

  console.log("appointments:", appointments);
  console.log("Upcoming appointments:", upcomingAppointments);

  // Find doctors for upcoming appointments
  const appointmentDoctors = upcomingAppointments.map((appointment) => {
    const doctor = mockDoctors.find((doc) => doc._id === appointment.doctorId);
    return {
      appointment,
      doctor,
    };
  });

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

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {currentUser.name}
        </h1>
      </div>

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
                {activePrescriptions.length}
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
              <h2 className="text-3xl font-bold text-gray-800">3</h2>
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
              <h2 className="text-3xl font-bold text-gray-800">85</h2>
              <p className="text-gray-600 mt-1">Heart Rate (bpm)</p>
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
                      key={appointment.id}
                      className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      {doctor && (
                        <Avatar user={doctor} size="md" className="mr-4" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {doctor?.name || "Unknown Doctor"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {doctor?.specialization || "Specialist"}
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
