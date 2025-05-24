import { useLocation, useNavigate } from "react-router-dom";
import { Clock, CalendarIcon, User } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { format } from "date-fns";

export const AppointmentWaiting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { appointmentTime, doctorName } = location.state || {
    appointmentTime: new Date().toISOString(),
    doctorName: "Your Doctor",
  };

  const formattedTime = format(
    new Date(appointmentTime),
    "MMMM d, yyyy h:mm a"
  );

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
                Your Appointment is Scheduled
              </h1>
              <p className="text-gray-600">
                Please wait until the scheduled time to join
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">With: {doctorName}</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">
                  Scheduled for: {formattedTime}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-800 mb-2">
                Meeting Instructions
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Join 5 minutes before your scheduled time</li>
                <li>• Check your internet connection</li>
                <li>• Use Chrome or Firefox for best experience</li>
                <li>• Have your ID ready if required</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                onClick={() => {
                  // Check if it's time to join yet
                  const now = new Date();
                  const meetingTime = new Date(appointmentTime);
                  const canJoinEarly = new Date(
                    meetingTime.getTime() - 5 * 60000
                  );

                  if (now >= canJoinEarly) {
                    // If time to join, navigate back to appointments page which will handle the join
                    navigate(-1);
                  } else {
                    // Show a message that it's still too early
                    alert(
                      `You can join 5 minutes before the meeting (after ${format(
                        canJoinEarly,
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
                onClick={() => navigate("/patient/appointments")}
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
