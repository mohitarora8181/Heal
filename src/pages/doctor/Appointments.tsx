import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { format, isBefore, addMinutes } from 'date-fns';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

// Define appointment interface based on your API response
interface Appointment {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        email: string;
        profileImageUrl?: string;
    };
    doctorId: {
        _id: string;
        name: string;
        email: string;
    };
    date: string;
    duration: number;
    type: 'video' | 'audio' | 'inperson';
    isUrgent: boolean;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export const DoctorAppointments = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!currentUser?._id) return;

            try {
                setLoading(true);
                setError('');

                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
                const token = localStorage.getItem('healToken');

                if (!token) {
                    throw new Error('Authentication token not found');
                }

                // Using doctor ID from currentUser to fetch appointments
                const response = await fetch(`${backendUrl}/appointments/${currentUser._id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch appointments');
                }

                const data = await response.json();
                setAppointments(data || []);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                setError(err instanceof Error ? err.message : 'Failed to load appointments');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentUser]);

    if (!currentUser) return null;

    const getAppointmentTypeIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <Video className="h-4 w-4" />;
            case 'audio':
                return <Phone className="h-4 w-4" />;
            default:
                return <MapPin className="h-4 w-4" />;
        }
    };

    // Sort appointments by date (closest first)
    const sortedAppointments = [...appointments].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysAppointments = sortedAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() === today.getTime();
    });

    // Get upcoming appointments (excluding today)
    const upcomingAppointments = sortedAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() > today.getTime();
    });

    // Join a meeting with time checks
    const joinMeeting = (appointmentId: string, appointmentDate: string, duration: number) => {
        const now = new Date();
        const appointmentTime = new Date(appointmentDate);
        const meetingEndTime = addMinutes(appointmentTime, duration);
        const canJoinEarly = addMinutes(appointmentTime, -10); // Doctors can join 10 mins early

        if (isBefore(now, canJoinEarly)) {
            // Too early to join - go to waiting room
            navigate('/waiting-room', {
                state: {
                    appointmentId,
                    appointmentTime: format(appointmentTime, 'MMMM d, yyyy h:mm a'),
                    patientName: appointments.find(a => a._id === appointmentId)?.patientId.name || 'the patient',
                    canJoinAt: format(canJoinEarly, 'MMMM d, yyyy h:mm a'), // 10 mins before for doctors
                    meetingType: appointments.find(a => a._id === appointmentId)?.type || 'video',
                    isDoctor: true
                },
            });
        } else if (isBefore(now, meetingEndTime)) {
            // Meeting is in progress or can be joined early - join directly
            window.location.href = `/videoconf/${appointmentId}`;
        } else {
            // Meeting has ended
            navigate('/appointment-ended', {
                state: {
                    appointmentTime: format(appointmentTime, 'MMMM d, yyyy h:mm a'),
                    patientName: appointments.find(a => a._id === appointmentId)?.patientId.name || 'the patient',
                    isDoctor: true
                },
            });
        }
    };

    // Check if a meeting can be joined now (for UI indication)
    const canJoinAppointment = (appointmentDate: string, duration: number) => {
        const now = new Date();
        const appointmentTime = new Date(appointmentDate);
        const meetingEndTime = addMinutes(appointmentTime, duration);
        const canJoinEarly = addMinutes(appointmentTime, -10); // Doctors can join 10 mins early

        return !isBefore(now, canJoinEarly) && isBefore(now, meetingEndTime);
    };

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
                    <p className="text-gray-600 mt-1">Manage your patient consultations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-error-50 text-error-700 p-4 rounded-lg">
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Today's Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-800">Today's Appointments</h2>
                                </CardHeader>
                                <CardContent>
                                    {todaysAppointments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="mb-4">
                                                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                                            </div>
                                            <h3 className="text-gray-600 mb-2">No appointments scheduled for today</h3>
                                            <p className="text-gray-500 text-sm">
                                                You don't have any appointments for today. Check your upcoming appointments below.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {todaysAppointments.map((appointment) => {
                                                const canJoin = canJoinAppointment(appointment.date, appointment.duration);

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
                                                                    _id: appointment.patientId._id,
                                                                    name: appointment.patientId.name,
                                                                    email: appointment.patientId.email,
                                                                    role: "patient",
                                                                    profileImageUrl: appointment.patientId.profileImageUrl
                                                                }}
                                                                size="md"
                                                                className="mr-4"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center">
                                                                    <h3 className="font-medium text-gray-800">
                                                                        {appointment.patientId.name}
                                                                    </h3>
                                                                    {appointment.isUrgent && (
                                                                        <Badge variant="error" className="ml-2">
                                                                            Urgent
                                                                        </Badge>
                                                                    )}
                                                                    {canJoin && (
                                                                        <Badge variant="success" className="ml-2">
                                                                            Ready to Join
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    Patient
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-center justify-end mb-1">
                                                                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {format(new Date(appointment.date), 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-end">
                                                                    {getAppointmentTypeIcon(appointment.type)}
                                                                    <span className="text-sm text-gray-600 ml-1">
                                                                        {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {appointment.duration} min
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex justify-end space-x-2">
                                                            {(appointment.type === 'video' || appointment.type === 'audio') && (
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => joinMeeting(
                                                                        appointment._id,
                                                                        appointment.date,
                                                                        appointment.duration
                                                                    )}
                                                                >
                                                                    {appointment.type === 'video'
                                                                        ? <><Video className="h-4 w-4 mr-1" /> Join Video Call</>
                                                                        : <><Phone className="h-4 w-4 mr-1" /> Join Audio Call</>
                                                                    }
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
                        </motion.div>

                        {/* Upcoming Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
                                </CardHeader>
                                <CardContent>
                                    {upcomingAppointments.length === 0 ? (
                                        <div className="text-center py-6">
                                            <p className="text-gray-500">No upcoming appointments scheduled.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {upcomingAppointments.map((appointment) => (
                                                <motion.div
                                                    key={appointment._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="p-4 border border-gray-100 rounded-lg bg-gray-50"
                                                >
                                                    <div className="flex items-center">
                                                        <Avatar
                                                            user={{
                                                                _id: appointment.patientId._id,
                                                                name: appointment.patientId.name,
                                                                email: appointment.patientId.email,
                                                                role: "patient",
                                                                profileImageUrl: appointment.patientId.profileImageUrl
                                                            }}
                                                            size="md"
                                                            className="mr-4"
                                                        />
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-800">
                                                                {appointment.patientId.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                Patient
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center justify-end mb-1">
                                                                <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                                                                <span className="text-sm text-gray-600">
                                                                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-end mb-1">
                                                                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                                                <span className="text-sm text-gray-600">
                                                                    {format(new Date(appointment.date), 'h:mm a')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-end">
                                                                {getAppointmentTypeIcon(appointment.type)}
                                                                <span className="text-sm text-gray-600 ml-1">
                                                                    {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                )}
            </div>
        </PageLayout>
    );
};