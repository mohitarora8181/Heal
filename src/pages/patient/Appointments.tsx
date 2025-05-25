import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarIcon, Clock, Video, Phone, MapPin } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Avatar } from "../../components/common/Avatar";
import { format, isBefore, addMinutes } from "date-fns";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
    email: string;
    specialization?: string;
    profileImageUrl?: string;
  };
  date: string;
  duration: number;
  type: "video" | "audio" | "inperson";
  isUrgent: boolean;
  status: "scheduled" | "completed" | "cancelled"
}

export const Appointments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser?._id) return;

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/appointments/${currentUser._id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch appointments");
        }

        const data = await response.json();
        setAppointments(data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser]);

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Phone className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const joinMeeting = (
    appointmentId: string,
    appointmentDate: string,
    duration: number
  ) => {
    const now = new Date();
    const appointmentTime = new Date(appointmentDate);
    const meetingEndTime = addMinutes(appointmentTime, duration);

    if (isBefore(now, appointmentTime)) {
      // Meeting hasn't started yet - go to waiting room
      navigate("/waiting-room", {
        state: {
          appointmentId,
          appointmentTime: format(appointmentTime, "MMMM d, yyyy h:mm a"),
          doctorName:
            appointments.find((a) => a._id === appointmentId)?.doctorId.name ||
            "the doctor",
          canJoinAt: format(
            addMinutes(appointmentTime, -5),
            "MMMM d, yyyy h:mm a"
          ), // 5 mins before
          meetingType:
            appointments.find((a) => a._id === appointmentId)?.type || "video",
        },
      });
    } else if (isBefore(now, meetingEndTime)) {
      // Meeting is in progress - join directly
      window.location.href = `/videoconf/${appointmentId}`;
    } else {
      // Meeting has ended
      navigate("/appointment-ended", {
        state: {
          appointmentTime: format(appointmentTime, "MMMM d, yyyy h:mm a"),
          doctorName:
            appointments.find((a) => a._id === appointmentId)?.doctorId.name ||
            "the doctor",
        },
      });
    }
  };

  // Get all appointments, sorted by date (closest first)
  const allAppointments = [...appointments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (!currentUser) return null;

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage your appointments and join meetings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-error-50 text-error-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-800">
                  Your Appointments
                </h2>
              </CardHeader>
              <CardContent>
                {allAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                    </div>
                    <h3 className="text-gray-600 mb-2">
                      No appointments found
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      You don't have any appointments scheduled. Book an
                      appointment with a doctor.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allAppointments.map((appointment) => {
                      const appointmentTime = new Date(appointment.date);
                      const now = new Date();
                      //@ts-ignore
                      const isUpcoming = isBefore(now, appointmentTime);
                      const meetingEndTime = addMinutes(
                        appointmentTime,
                        appointment.duration
                      );
                      const canJoinEarly = addMinutes(appointmentTime, -5);
                      //@ts-ignore
                      const canJoinNow =
                        isBefore(now, meetingEndTime) &&
                        !isBefore(now, canJoinEarly);

                      return (
                        <motion.div
                          key={appointment._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 border border-gray-100 rounded-lg hover:border-primary-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Avatar
                              user={{
                                _id: appointment.doctorId._id,
                                name: appointment.doctorId.name,
                                email: appointment.doctorId.email,
                                role: "doctor",
                                profileImageUrl:
                                  appointment.doctorId.profileImageUrl,
                              }}
                              size="md"
                              className="mr-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-gray-800">
                                  {appointment.doctorId.name}
                                </h3>
                                {appointment.isUrgent && (
                                  <Badge variant="error" className="ml-2">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {appointment.doctorId.specialization ||
                                  "Doctor"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end mb-1">
                                <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                                <span className="text-sm text-gray-600">
                                  {format(appointmentTime, "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center justify-end mb-1">
                                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                <span className="text-sm text-gray-600">
                                  {format(appointmentTime, "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center justify-end">
                                {getAppointmentTypeIcon(appointment.type)}
                                <span className="text-sm text-gray-600 ml-1">
                                  {appointment.type.charAt(0).toUpperCase() +
                                    appointment.type.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end space-x-2">
                            {(appointment.type === "video" ||
                              appointment.type === "audio") && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={appointment.status == "completed"}
                                  onClick={() =>
                                    joinMeeting(
                                      appointment._id,
                                      appointment.date,
                                      appointment.duration
                                    )
                                  }
                                >
                                  {appointment.status == "completed" ? "Attended" : appointment.type === "video"
                                    ? "Join Video Call"
                                    : "Join Audio Call"}
                                </Button>
                              )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};
