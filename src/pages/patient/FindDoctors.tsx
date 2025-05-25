import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  Calendar as CalIcon,
  AlertCircle,
  X,
  MessageCircle,
} from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Card, CardContent } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Avatar } from "../../components/common/Avatar";
import { useAuth } from "../../auth/AuthContext";
import Calendar, { type CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import SquarePaymentButton from "../../components/SquarePaymentButton";

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  qualifications: string[];
  rating?: number;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const FindDoctors = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<
    "video" | "audio" | "inperson"
  >("video");
  const [isUrgent, setIsUrgent] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [readyForPayment, setReadyForPayment] = useState(false);

  const handleDateChange: CalendarProps["onChange"] = (value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const startConversation = async (doctor: Doctor) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      if (!token) {
        throw new Error("Authentication required");
      }

      // Create or get conversation with the doctor
      const response = await fetch(`${backendUrl}/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: doctor._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await response.json();

      // Navigate to messages page
      window.location.href = `/patient/messages?conversation=${conversation._id}`;
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const token = localStorage.getItem("healToken");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(`${backendUrl}/users?role=doctor`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch doctors");
        }

        const responseData = await response.json();
        const data = responseData.users || [];

        const fetchedDoctors: Doctor[] = data.map((doc: any) => ({
          _id: doc._id,
          name: doc.name || "Unknown",
          email: doc.email,
          specialization: doc.specialization || "General Practitioner",
          qualifications: doc.qualifications || [],
          rating: doc.rating || 4.8,
          profileImageUrl: doc.profileImageUrl || null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));

        setDoctors(fetchedDoctors);

        const specs = Array.from(
          new Set(
            fetchedDoctors
              .map((doctor) => doctor.specialization)
              .filter((spec) => spec)
          )
        );
        setSpecializations(specs.length > 0 ? specs : ["General Practitioner"]);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(err instanceof Error ? err.message : "Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization =
      selectedSpecialization === "all" ||
      doctor.specialization === selectedSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setSelectedDate(new Date());
    setSelectedTime("");
    setAppointmentType("video");
    setIsUrgent(false);
    setBookingError("");
    setBookingSuccess(false);
    setReadyForPayment(false);
  };

  const handleViewProfile = (doctorId: string) => {
    window.location.href = `/patient/doctor/${doctorId}`;
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedDoctor(null);
    setReadyForPayment(false);
  };

  const generateTimeSlots = () => {
    const slots = [];

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    let startHour = 9; // Default start hour (9 AM)
    let startMinute = 0; // Default start minute

    if (isToday) {
      startHour = now.getHours();

      // If we're in the middle of an hour, move to next 30-min slot
      if (now.getMinutes() >= 0 && now.getMinutes() < 30) {
        startMinute = 30;
      } else {
        startMinute = 0;
        startHour += 1; // Move to next hour
      }
    }

    // Generate time slots from 9 AM to 5 PM
    for (let hour = 9; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        // Skip times in the past for today
        if (
          isToday &&
          (hour < startHour || (hour === startHour && minute < startMinute))
        ) {
          continue;
        }

        // Format in 24-hour format for value, but display in 12-hour format
        const formattedMinute = minute === 0 ? "00" : "30";
        const timeValue = `${hour}:${formattedMinute}`; // 24-hour format for value

        // Create 12-hour format display
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? "AM" : "PM";
        const displayTime = `${displayHour}:${formattedMinute} ${amPm}`;

        slots.push({
          value: timeValue,
          display: displayTime,
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const submitAppointmentRequest = async () => {
    if (!selectedTime) {
      setBookingError("Please select a time for your appointment");
      return;
    }

    if (!selectedDoctor) {
      setBookingError("Something went wrong. Please try again.");
      return;
    }

    setReadyForPayment(true);
  };

  const createAppointment = async () => {
    try {
      setBookingLoading(true);
      setBookingError("");

      const [hours, minutes] = selectedTime.split(":");
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(Number(hours), Number(minutes), 0);

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const token = localStorage.getItem("healToken");

      const response = await fetch(`${backendUrl}/appointments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: currentUser?._id,
          doctorId: selectedDoctor?._id,
          date: appointmentDate.toISOString(),
          duration: 30,
          type: appointmentType,
          isUrgent: isUrgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      setBookingSuccess(true);
      setTimeout(() => {
        closeBookingModal();
        window.location.href = "/patient/appointments";
      }, 2000);
    } catch (err) {
      console.error("Error booking appointment:", err);
      setBookingError(
        err instanceof Error ? err.message : "Failed to book appointment"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Find Doctors</h1>
        <p className="text-gray-600 mt-1">
          Connect with qualified healthcare professionals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="p-4">
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Search</h3>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  Specialization
                </h3>
                <div className="space-y-2">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedSpecialization === "all"
                        ? "bg-primary-50 text-primary-700"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedSpecialization("all")}
                  >
                    All Specializations
                  </button>
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedSpecialization === spec
                          ? "bg-primary-50 text-primary-700"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedSpecialization(spec)}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-error-50 text-error-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-600">
                No doctors found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doctor) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Avatar
                          user={{
                            _id: doctor._id,
                            name: doctor.name,
                            profileImageUrl:
                              doctor.profileImageUrl || undefined,
                            email: doctor.email,
                            role: "doctor",
                          }}
                          size="lg"
                          className="mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {doctor.specialization || "General Practitioner"}
                          </p>
                          {doctor.rating && (
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">
                                {doctor.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>Available for Online Consultation</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalIcon className="h-4 w-4 mr-2" />
                          <span>
                            Member since:{" "}
                            {new Date(
                              doctor.createdAt || ""
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {doctor.qualifications &&
                      doctor.qualifications.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {doctor.qualifications.map((qual, index) => (
                            <div
                              key={index}
                              className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {qual}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-gray-500">
                          Contact for qualification details
                        </div>
                      )}

                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(doctor._id)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startConversation(doctor)}
                            className="flex items-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleBookAppointment(doctor)}
                        >
                          Book Appointment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Appointment Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white h-full rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Book Appointment
                </h2>
                <button
                  onClick={closeBookingModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center mb-6">
                <Avatar
                  user={{
                    _id: selectedDoctor._id,
                    name: selectedDoctor.name,
                    profileImageUrl:
                      selectedDoctor.profileImageUrl || undefined,
                    email: selectedDoctor.email,
                    role: "doctor",
                  }}
                  size="lg"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-medium text-gray-800">
                    {selectedDoctor.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedDoctor.specialization || "General Practitioner"}
                  </p>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="bg-success-50 text-success-700 p-4 rounded-lg mb-6">
                  <p>
                    Your appointment has been booked successfully! Redirecting
                    to appointments page...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Select Date
                    </h4>
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      className="w-full border rounded-lg"
                      minDate={new Date()}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Select Time
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.value}
                          variant={
                            selectedTime === slot.value ? "primary" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedTime(slot.value)}
                          className="justify-center"
                        >
                          {slot.display}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Appointment Type
                    </h4>
                    <div className="flex space-x-2">
                      <Button
                        variant={
                          appointmentType === "video" ? "primary" : "outline"
                        }
                        size="sm"
                        onClick={() => setAppointmentType("video")}
                      >
                        Video Call
                      </Button>
                      <Button
                        variant={
                          appointmentType === "inperson" ? "primary" : "outline"
                        }
                        size="sm"
                        onClick={() => setAppointmentType("inperson")}
                      >
                        In Person
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="urgentCheckbox"
                      checked={isUrgent}
                      onChange={() => setIsUrgent(!isUrgent)}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="urgentCheckbox"
                      className="ml-2 text-gray-700"
                    >
                      This is an urgent appointment
                    </label>
                  </div>

                  {bookingError && (
                    <div className="bg-error-50 text-error-700 p-4 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{bookingError}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={closeBookingModal}
                      disabled={bookingLoading}
                    >
                      Cancel
                    </Button>
                    {readyForPayment ? (
                      <SquarePaymentButton
                        amount={5000}
                        patientId={currentUser?._id || ""}
                        doctorId={selectedDoctor._id}
                        type={appointmentType}
                        method={"card"}
                        onSuccess={createAppointment}
                        onError={(error) => setBookingError(error)}
                        onClose={() => setReadyForPayment(false)}
                      />
                    ) : (
                      <Button
                        onClick={submitAppointmentRequest}
                        disabled={bookingLoading || !selectedTime}
                      >
                        Continue to Payment
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};
