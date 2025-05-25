import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
    Calendar, Clock, Video, Phone, AlertTriangle,
    FileText, Pill, FileCheck, Mail
} from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../auth/AuthContext';
import { format, parseISO } from 'date-fns';

// Define interfaces for data structures
interface Appointment {
    _id: string;
    patientId: string;
    doctorId: string;
    date: string;
    duration: number;
    type: string;
    isUrgent: boolean;
    __v: number;
}

interface MedicalRecord {
    _id: string;
    patientId: string;
    doctorId: string;
    date: string;
    title: string;
    description: string;
    type: string;
    fileUrl?: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
    _id: string;
}

interface Prescription {
    _id: string;
    patientId: string;
    doctorId: string;
    medications: Medication[];
    instructions: string;
    date: string;
    refillable: boolean;
    refills: number;
    __v: number;
}

export const PatientProfile = () => {
    const { currentUser } = useAuth();
    const params = useParams<{ patientId?: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [profileUser, setProfileUser] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    const isDoctorViewingPatient = currentUser?.role === 'doctor' && params.patientId;

    useEffect(() => {
        if (isDoctorViewingPatient) {
            fetchPatientData(params.patientId);
        } else {
            setProfileUser(currentUser);
            fetchPatientData(currentUser?._id);
        }
    }, [currentUser, params.patientId]);

    const fetchPatientData = async (userId?: string) => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
            const token = localStorage.getItem("healToken");

            if (!token) {
                throw new Error("Authentication required");
            }

            // If doctor is viewing patient profile, fetch the patient's details
            if (isDoctorViewingPatient) {
                const userResponse = await fetch(`${backendUrl}/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!userResponse.ok) {
                    throw new Error("Failed to fetch patient details");
                }

                const { user } = await userResponse.json();
                setProfileUser(user);
            }

            // Fetch appointments
            const appointmentsResponse = await fetch(
                `${backendUrl}/appointments/${userId}`,
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

            // Fetch medical records
            const recordsResponse = await fetch(
                `${backendUrl}/medical-records/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json();
                setMedicalRecords(Array.isArray(recordsData) ? recordsData : []);
            }

            // Fetch prescriptions
            const prescriptionsResponse = await fetch(
                `${backendUrl}/prescriptions?userRole=patient&userId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (prescriptionsResponse.ok) {
                const prescriptionsData = await prescriptionsResponse.json();
                setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
            }

        } catch (error) {
            console.error("Error fetching patient data:", error);
            setError("Failed to load patient information. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!profileUser && !isLoading) return (
        <PageLayout>
            <div className="flex flex-col items-center justify-center h-64">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Patient profile not found</p>
            </div>
        </PageLayout>
    );

    return (
        <PageLayout>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isDoctorViewingPatient ? `Patient: ${profileUser?.name}` : 'My Health Profile'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isDoctorViewingPatient
                                ? 'View patient\'s medical information'
                                : 'View your personal medical information'}
                        </p>
                    </div>
                    {isDoctorViewingPatient && (
                        <Badge variant="primary" className="mt-2 md:mt-0">
                            Doctor View
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
                <div className="space-y-6">
                    {/* User Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="overflow-hidden border-none shadow-md">
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-24"></div>
                            <CardContent className="p-6 -mt-12 relative">
                                <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
                                    <div className="bg-white p-1 rounded-full shadow-lg">
                                        <Avatar user={profileUser} size="xl" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h2 className="text-2xl font-bold text-white max-sm:text-gray-700">{profileUser?.name}</h2>
                                        <div className="flex items-center py-1 justify-center md:justify-start space-x-1 text-gray-600 mt-1">
                                            <Mail size={16} />
                                            <span>{profileUser?.email}</span>
                                        </div>
                                        <Badge variant="secondary" className="mt-2">Patient</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Upcoming Appointments */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center">
                                    <Calendar className="h-5 w-5 text-primary-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-800">Appointments</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {appointments.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                        {appointments
                                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                            .slice(0, 4)
                                            .map(appointment => (
                                                <div key={appointment._id}
                                                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center mb-2">
                                                                {appointment.type === 'video' ?
                                                                    <Video className="h-4 w-4 text-blue-500 mr-1" /> :
                                                                    <Phone className="h-4 w-4 text-green-500 mr-1" />}
                                                                <h4 className="font-medium text-gray-800">
                                                                    {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)} Consultation
                                                                </h4>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {format(parseISO(appointment.date), 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {appointment.duration} minutes
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {appointment.isUrgent && (
                                                            <Badge variant="error" className="flex items-center">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                Urgent
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {isDoctorViewingPatient
                                                ? 'This patient has no appointments'
                                                : 'You don\'t have any upcoming appointments'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recent Medical Records */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-primary-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-800">Medical Records</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {medicalRecords.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {medicalRecords.map(record => (
                                                    <tr key={record._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{record.title}</div>
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">{record.description}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <Badge variant={
                                                                record.type === 'lab_report' ? 'primary' :
                                                                    record.type === 'prescription' ? 'success' :
                                                                        record.type === 'imaging' ? 'warning' : 'secondary'
                                                            }>
                                                                {record.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {format(new Date(record.date), 'MMM d, yyyy')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            {record.fileUrl && (
                                                                <a
                                                                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/medical-records/files/${record.fileUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary-600 hover:text-primary-800 inline-flex items-center"
                                                                >
                                                                    <FileCheck className="h-4 w-4 mr-1" />
                                                                    View File
                                                                </a>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {isDoctorViewingPatient
                                                ? 'No medical records found for this patient'
                                                : 'No medical records found'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Current Prescriptions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center">
                                    <Pill className="h-5 w-5 text-primary-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-800">Current Medications</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {prescriptions.length > 0 ? (
                                    <div className="space-y-6">
                                        {prescriptions.map(prescription => (
                                            <div key={prescription._id} className="bg-white rounded-lg border border-gray-200">
                                                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-sm text-gray-500">
                                                                Prescribed on {format(new Date(prescription.date), 'MMMM d, yyyy')}
                                                            </div>
                                                        </div>
                                                        {prescription.refillable && (
                                                            <Badge variant="success" className="ml-2">
                                                                {prescription.refills} refills remaining
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Medications list */}
                                                <div className="divide-y divide-gray-100">
                                                    {prescription.medications.map((med, idx) => (
                                                        <div key={idx} className="p-4 hover:bg-gray-50">
                                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                                                <div className="mb-2 md:mb-0">
                                                                    <h4 className="font-medium text-gray-800">
                                                                        {med.name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500">
                                                                        {med.dosage}
                                                                    </p>
                                                                </div>
                                                                <div className="flex space-x-4 text-sm text-gray-600">
                                                                    <div>
                                                                        <span className="font-medium">Frequency:</span> {med.frequency}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Duration:</span> {med.duration}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {med.notes && (
                                                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                                    <span className="font-medium">Notes:</span> {med.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Instructions */}
                                                {prescription.instructions && (
                                                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                                                        <h5 className="font-medium text-gray-700 mb-1">Instructions</h5>
                                                        <p className="text-sm text-gray-600">
                                                            {prescription.instructions}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                            {isDoctorViewingPatient
                                                ? 'This patient has no active prescriptions'
                                                : 'No active prescriptions'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    );
};