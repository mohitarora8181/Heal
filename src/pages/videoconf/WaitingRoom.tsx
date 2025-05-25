import { useLocation, useNavigate } from "react-router-dom";
import { Clock, CalendarIcon, User, Video, Phone } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { format } from "date-fns";

export const AppointmentWaiting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get all relevant information from location state with defaults
  const {
    appointmentId,
    appointmentTime,
    doctorName,
    patientName,
    canJoinAt,
    meetingType = "video",
    isDoctor = false
  } = location.state || {
    appointmentTime: new Date().toISOString(),
    doctorName: "Your Doctor",
    patientName: "Your Patient",
    canJoinAt: new Date(new Date().getTime() + 5 * 60000).toISOString(),
  };

  const formattedTime = format(
    new Date(appointmentTime),
    "MMMM d, yyyy h:mm a"
  );

  // Determine join times based on role
  const joinBufferMinutes = isDoctor ? 10 : 5;

  // Get meeting icon based on type
  const getMeetingIcon = () => {
    switch (meetingType) {
      case 'video': return <Video className="h-5 w-5 text-gray-500" />;
      case 'audio': return <Phone className="h-5 w-5 text-gray-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get formatted meeting type text
  const getMeetingTypeText = () => {
    switch (meetingType) {
      case 'video': return "Video Consultation";
      case 'audio': return "Audio Consultation";
      default: return "Consultation";
    }
  };

  return (
    <PageLayout>
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {isDoctor ? "Waiting for Appointment Time" : "Your Appointment is Scheduled"}
              </h1>
              <p className="text-gray-600">
                Please wait until the scheduled time to join
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">
                  {isDoctor ? `With: ${patientName}` : `With: ${doctorName}`}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">
                  Scheduled for: {formattedTime}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                {getMeetingIcon()}
                <span className="text-gray-700">
                  {getMeetingTypeText()}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">
                  You can join at: {canJoinAt || format(
                    new Date(new Date(appointmentTime).getTime() - joinBufferMinutes * 60000),
                    "h:mm a"
                  )}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-800 mb-2">
                Meeting Instructions
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Join {joinBufferMinutes} minutes before your scheduled time</li>
                <li>• Check your internet connection</li>
                <li>• Use Chrome or Firefox for best experience</li>
                {isDoctor ? (
                  <li>• Have patient records ready to review</li>
                ) : (
                  <li>• Have your ID ready if required</li>
                )}
                <li>• Ensure you're in a quiet, private space</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                onClick={() => {
                  // Check if it's time to join yet
                  const now = new Date();
                  const meetingTime = new Date(appointmentTime);
                  const canJoinEarlyTime = new Date(
                    meetingTime.getTime() - joinBufferMinutes * 60000
                  );

                  if (now >= canJoinEarlyTime) {
                    // If time to join, navigate directly to the video conference
                    if (appointmentId) {
                      window.location.href = `/videoconf/${appointmentId}`;
                    } else {
                      // If no appointmentId, go back to appointments
                      navigate(isDoctor ? '/doctor/appointments' : '/patient/appointments');
                    }
                  } else {
                    // Show a message that it's still too early
                    alert(
                      `You can join ${joinBufferMinutes} minutes before the meeting (after ${format(
                        canJoinEarlyTime,
                        "h:mm a"
                      )})`
                    );
                  }
                }}
              >
                Try Joining Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(isDoctor ? "/doctor/appointments" : "/patient/appointments")}
              >
                Back to Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};
