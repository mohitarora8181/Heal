import { motion } from "framer-motion";
import { Calendar, Users, MessageCircle, Activity, Clock } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Avatar } from "../../components/common/Avatar";
import { useAuth } from "../../auth/AuthContext";
import { format } from "date-fns";
import { mockPatients } from "../../../dummyData";
import { useEffect, useState } from "react";

export const DoctorDashboard = () => {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<any>([]);

  if (!currentUser || currentUser.role !== "doctor") {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/appointments/${currentUser._id}`
      );
      if (!response.ok) {
        console.error("Failed to fetch appointments");
        return;
      }
      const data = await response.json();

      setAppointments(data);
    };
    fetchAppointments();
  }, [currentUser._id]);

  // Filter today's appointments for the current doctor
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysAppointments = appointments
    .filter(
      (appointment: any) =>
        new Date(appointment.date).setHours(0, 0, 0, 0) === today.getTime()
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find patients for today's appointments
  const appointmentPatients = todaysAppointments.map((appointment: any) => {
    const patient = mockPatients.find(
      (pat) => pat.id === appointment.patientId
    );
    return {
      appointment,
      patient,
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
        <p className="text-gray-600 mt-1">Here's your practice overview</p>
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
                {mockPatients.length}
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
              <h2 className="text-3xl font-bold text-gray-800">12</h2>
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
              <h2 className="text-3xl font-bold text-gray-800">95%</h2>
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
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentPatients.length > 0 ? (
                <div className="space-y-4">
                  {appointmentPatients.map(({ appointment, patient }) => (
                    <div
                      key={appointment.id}
                      className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      {patient && (
                        <Avatar user={patient} size="md" className="mr-4" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {patient?.name || "Unknown Patient"}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPatients.slice(0, 3).map((patient) => (
                  <div key={patient.id} className="flex items-center">
                    <Avatar user={patient} size="md" className="mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {patient.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {patient.medicalHistory
                          ? patient.medicalHistory
                          : "No medical history"}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="ml-auto">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
};
