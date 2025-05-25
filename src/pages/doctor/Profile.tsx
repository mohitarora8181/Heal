import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
    Calendar, Clock, User, Star, Phone, Mail,
    Award, Briefcase, Stethoscope, FileText, Users
} from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../auth/AuthContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Define interfaces for data structures
interface Patient {
    _id: string;
    name: string;
    email: string;
    role: string;
    imageUrl?: string;
}

interface Appointment {
    _id: string;
    patientId: string;
    doctorId: string;
    date: string;
    duration: number;
    type: string;
    isUrgent: boolean;
    status: string;
    patient?: {
        name: string;
        _id: string;
        email: string;
        imageUrl?: string;
    };
}

interface DoctorDetails {
    specialization: string;
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    experience: Array<{
        position: string;
        hospital: string;
        duration: string;
    }>;
    languages: string[];
    consultationFee?: number;
    availability?: {
        days: string[];
        hours: string;
    };
    bio?: string;
    rating?: number;
    totalPatients?: number;
    totalAppointments?: number;
    yearsOfExperience?: number;
}

export const DoctorProfile = () => {
    const { currentUser } = useAuth();
    const params = useParams<{ doctorId?: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [profileDoctor, setProfileDoctor] = useState<any>(null);
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

    const isViewingOtherDoctor = params.doctorId && params.doctorId !== currentUser?._id;

    useEffect(() => {
        if (isViewingOtherDoctor) {
            fetchDoctorData(params.doctorId);
        } else if (currentUser?._id) {
            setProfileDoctor(currentUser);
            fetchDoctorData(currentUser._id);
        }
    }, [currentUser, params.doctorId]);

    const fetchDoctorData = async (userId?: string) => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
            const token = localStorage.getItem("healToken");

            if (!token) {
                throw new Error("Authentication required");
            }

            // If viewing another doctor, fetch their user details first
            if (isViewingOtherDoctor) {
                const doctorResponse = await fetch(`${backendUrl}/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!doctorResponse.ok) {
                    throw new Error("Failed to fetch doctor details");
                }

                const { user } = await doctorResponse.json();

                // Make sure we're actually viewing a doctor
                if (user.role !== 'doctor') {
                    throw new Error("The requested profile is not a doctor");
                }

                setProfileDoctor(user);
            }

            const appointmentsResponse = await fetch(
                `${backendUrl}/appointments?userRole=doctor&userId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (appointmentsResponse.ok) {
                const appointmentsData = await appointmentsResponse.json();
                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
            }

            // Fetch patients
            const patientsResponse = await fetch(
                `${backendUrl}/users?role=patient&doctorId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Enhance appointments with patient data
            if (appointmentsResponse.ok && patientsResponse.ok) {
                const appointmentsData = await appointmentsResponse.json();
                const patientsData = await patientsResponse.json();

                const enhancedAppointments = appointmentsData.map((appointment: Appointment) => {
                    const patientData = patientsData.find((p: Patient) => p._id === appointment.patientId);
                    return {
                        ...appointment,
                        patient: patientData ? {
                            _id: patientData._id,
                            name: patientData.name,
                            email: patientData.email,
                            imageUrl: patientData.imageUrl
                        } : undefined
                    };
                });

                setAppointments(enhancedAppointments);
            }

        } catch (error) {
            console.error("Error fetching doctor data:", error);
            setError("Failed to load doctor information. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter for upcoming appointments
    const upcomingAppointments = appointments
        .filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= new Date();
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    // Early return for unauthorized users
    if (!currentUser) {
        return (
            <PageLayout>
                <div className="flex flex-col items-center justify-center h-64">
                    <User className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Please login to view doctor profiles</p>
                </div>
            </PageLayout>
        );
    }

    // Show profile not found if doctor doesn't exist
    if (!isLoading && !profileDoctor && isViewingOtherDoctor) {
        return (
            <PageLayout>
                <div className="flex flex-col items-center justify-center h-64">
                    <User className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Doctor profile not found</p>
                </div>
            </PageLayout>
        );
    }

    // Get the doctor to display (either current user or fetched doctor)
    const displayDoctor = profileDoctor || currentUser;

    return (
        <PageLayout>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isViewingOtherDoctor ? `Dr. ${displayDoctor.name}` : 'My Profile'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isViewingOtherDoctor
                                ? `View ${displayDoctor.name}'s professional details`
                                : 'Manage your professional information'}
                        </p>
                    </div>
                    {isViewingOtherDoctor && (
                        <Badge variant="primary" className="mt-2 md:mt-0">
                            Doctor Profile
                        </Badge>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                    <p className="text-error-700">{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {/* Doctor Profile Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="overflow-hidden border-none shadow-md">
                                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-24"></div>
                                    <CardContent className="p-6 -mt-12 relative">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-1 rounded-full shadow-lg">
                                                <Avatar user={displayDoctor} size="xl" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-800 mt-4">{displayDoctor.name}</h2>

                                            {doctorDetails?.specialization && (
                                                <p className="text-gray-600 font-medium">
                                                    {doctorDetails.specialization}
                                                </p>
                                            )}

                                            <div className="flex items-center mt-2">
                                                <Star className="h-4 w-4 text-yellow-400" />
                                                <span className="text-sm font-medium ml-1">
                                                    {doctorDetails?.rating || '4.8'} Rating
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center">
                                                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                                <span className="text-gray-600">{displayDoctor.email}</span>
                                            </div>

                                            {doctorDetails?.languages && doctorDetails.languages.length > 0 && (
                                                <div className="flex items-center">
                                                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                                                    <span className="text-gray-600">
                                                        {doctorDetails.languages.join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {doctorDetails?.bio && (
                                            <div className="mt-6">
                                                <p className="text-gray-600 text-sm">
                                                    {doctorDetails.bio}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Availability */}
                            {doctorDetails?.availability && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Availability
                                            </h2>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-600 mb-2">Days</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {doctorDetails.availability.days.map((day, index) => (
                                                            <Badge key={index} variant="secondary">
                                                                {day}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-600 mb-2">Hours</h3>
                                                    <p className="text-gray-800">
                                                        {doctorDetails.availability.hours}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {/* Experience and Education */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center">
                                        <Briefcase className="h-5 w-5 text-secondary-500 mr-2" />
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Professional Experience
                                        </h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {doctorDetails?.experience && doctorDetails.experience.length > 0 ? (
                                        <div className="space-y-6">
                                            {doctorDetails.experience.map((exp, index) => (
                                                <div key={index} className="flex">
                                                    <div className="mr-4 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                                                            <Stethoscope className="h-5 w-5 text-secondary-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-semibold text-gray-800">
                                                            {exp.position}
                                                        </h3>
                                                        <p className="text-gray-600">{exp.hospital}</p>
                                                        <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No experience information available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center">
                                        <Award className="h-5 w-5 text-secondary-500 mr-2" />
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Education & Qualifications
                                        </h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {doctorDetails?.education && doctorDetails.education.length > 0 ? (
                                        <div className="space-y-6">
                                            {doctorDetails.education.map((edu, index) => (
                                                <div key={index} className="flex">
                                                    <div className="mr-4 flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                                                            <Award className="h-5 w-5 text-secondary-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-semibold text-gray-800">
                                                            {edu.degree}
                                                        </h3>
                                                        <p className="text-gray-600">{edu.institution}</p>
                                                        <p className="text-sm text-gray-500 mt-1">{edu.year}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No education information available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Upcoming Appointments - Only shown if viewing own profile */}
                        {!isViewingOtherDoctor && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <Card className="shadow-sm">
                                    <CardHeader className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Calendar className="h-5 w-5 text-secondary-500 mr-2" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Upcoming Appointments
                                            </h2>
                                        </div>
                                        <Link to="/doctor/appointments">
                                            <Badge variant="primary" className="cursor-pointer">
                                                View All
                                            </Badge>
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {upcomingAppointments.length > 0 ? (
                                            <div className="space-y-4">
                                                {upcomingAppointments.map(appointment => (
                                                    <div
                                                        key={appointment._id}
                                                        className="flex items-center p-4 rounded-lg border border-gray-100 hover:border-secondary-200 transition-colors"
                                                    >
                                                        {appointment.patient && (
                                                            <Avatar
                                                                user={{ ...(appointment.patient), role: "patient" }}
                                                                size="md"
                                                                className="mr-4"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <Link to={`/doctor/patients/${appointment.patientId}`}>
                                                                <h3 className="font-medium text-gray-800 hover:text-secondary-600 transition-colors">
                                                                    {appointment.patient?.name || "Patient"}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-sm text-gray-500">
                                                                {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)} Consultation
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-gray-800">
                                                                {format(new Date(appointment.date), "MMM d, yyyy")}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {format(new Date(appointment.date), "h:mm a")}
                                                            </div>
                                                            <div className="mt-2">
                                                                <Badge
                                                                    variant={
                                                                        appointment.status === 'confirmed' ? 'success' :
                                                                            appointment.status === 'pending' ? 'warning' :
                                                                                'secondary'
                                                                    }
                                                                >
                                                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
                                            <div className="text-center py-6">
                                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500">No upcoming appointments</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Recent Patients - Only shown if viewing own profile */}
                        {!isViewingOtherDoctor && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <Card className="shadow-sm">
                                    <CardHeader className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <Users className="h-5 w-5 text-secondary-500 mr-2" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Recent Patients
                                            </h2>
                                        </div>
                                        <Link to="/doctor/patients">
                                            <Badge variant="accent" className="cursor-pointer">
                                                View All
                                            </Badge>
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {recentPatients.length > 0 ? (
                                            <div className="space-y-4">
                                                {recentPatients.map(patient => (
                                                    <div key={patient._id} className="flex items-center">
                                                        <Avatar user={patient} size="md" className="mr-3" />
                                                        <div className="flex-1">
                                                            <Link to={`/doctor/patients/${patient._id}`}>
                                                                <h3 className="font-medium text-gray-800 hover:text-secondary-600 transition-colors">
                                                                    {patient.name}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-xs text-gray-500">{patient.email}</p>
                                                        </div>
                                                        <Link to={`/doctor/patients/${patient._id}`}>
                                                            <div className="flex items-center text-sm text-secondary-600 hover:text-secondary-800">
                                                                <FileText className="h-4 w-4 mr-1" />
                                                                View Profile
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500">No patients yet</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

// Lucide icons import for Globe (was missing from the imports)
function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

// Lucide icons import for Activity (was missing from the imports)
function Activity(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}