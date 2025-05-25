import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, MessageCircle, User, X, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useNavigate } from 'react-router-dom';
import type { Doctor } from '../../../types';

// Define patient interface
interface Patient {
    _id: string;
    name: string;
    email: string;
    role: string;
    medicalHistory?: string;
    allergies?: string[];
    profileImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// Add this interface for medical records
interface MedicalRecord {
    _id: string;
    patientId: string;
    doctorId: Doctor;
    date: Date | string;
    title: string;
    description: string;
    type: string;
    fileUrl?: string;
}

export const DoctorPatients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Add these new states
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [recordsError, setRecordsError] = useState('');
    const [recordSearchTerm, setRecordSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        setError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${backendUrl}/users?role=patient`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch patients');
            }

            const data = await response.json();

            // Handle different response formats
            const patientsList = Array.isArray(data) ? data : data.users || [];
            setPatients(patientsList);
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (patientId: string) => {
        navigate(`/doctor/patients/${patientId}`);
    };

    const startConversation = async (patient: Patient) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            // Create or get conversation with the patient
            const response = await fetch(`${backendUrl}/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId: patient._id })
            });

            if (!response.ok) {
                throw new Error('Failed to create conversation');
            }

            const conversation = await response.json();

            // Navigate to messages page with the conversation ID
            navigate(`/doctor/messages?conversation=${conversation._id}`);
        } catch (error) {
            console.error('Error starting conversation:', error);
            setError('Failed to start conversation. Please try again.');
        }
    };

    const handleViewRecords = async (patient: Patient) => {
        setSelectedPatient(patient);
        setShowRecordsModal(true);
        setPatientRecords([]);
        setRecordsError('');
        setRecordSearchTerm('');
        setLoadingRecords(true);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${backendUrl}/medical-records/${patient._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch patient records');
            }

            const data = await response.json();
            setPatientRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching patient records:', err);
            setRecordsError('Failed to load patient records. Please try again later.');
        } finally {
            setLoadingRecords(false);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredRecords = patientRecords.filter(record =>
        record.title.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(recordSearchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(recordSearchTerm.toLowerCase())
    );

    return (
        <PageLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                <p className="text-gray-600 mt-1">Manage and view your patient records</p>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                        />
                        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                    <p className="text-error-700">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No patients found</h3>
                    <p className="text-gray-500 mt-2">
                        {searchTerm ? `No results for "${searchTerm}"` : "You don't have any patients yet"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map(patient => (
                        <motion.div
                            key={patient._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="h-full">
                                <CardContent className="p-4">
                                    <div className="flex items-start">
                                        <Avatar
                                            user={{
                                                ...patient,
                                                role: patient.role as any // Handle potential type mismatch
                                            }}
                                            size="lg"
                                            className="mr-4"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{patient.name}</h3>
                                            <p className="text-sm text-gray-500">{patient.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Patient since {new Date(patient.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Medical History</h4>
                                        <p className="text-sm text-gray-600 line-clamp-3">
                                            {patient.medicalHistory || 'No medical history recorded'}
                                        </p>
                                    </div>

                                    {patient.allergies && patient.allergies.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {patient.allergies.map((allergy, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-xs bg-error-50 text-error-700 px-2 py-1 rounded-full"
                                                    >
                                                        {allergy}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 grid grid-cols-1 gap-2">
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            size="sm"
                                            className="flex items-center justify-center"
                                            onClick={() => handleViewRecords(patient)}
                                        >
                                            <FileText className="h-4 w-4 mr-1" />
                                            Records
                                        </Button>
                                        <div className='w-full flex gap-2'>
                                            <Button
                                                variant="outline"
                                                fullWidth
                                                size="sm"
                                                className="flex items-center justify-center"
                                                onClick={() => startConversation(patient)}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-1" />
                                                Message
                                            </Button>
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                size="sm"
                                                onClick={() => handleViewProfile(patient._id)}
                                            >
                                                View Profile
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Patient Records Modal */}
            {showRecordsModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Medical Records: {selectedPatient.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedPatient.email}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRecordsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 border-b">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Search records..."
                                    value={recordSearchTerm}
                                    onChange={(e) => setRecordSearchTerm(e.target.value)}
                                    fullWidth
                                />
                                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {recordsError && (
                                <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                                    <p className="text-error-700">{recordsError}</p>
                                </div>
                            )}

                            {loadingRecords ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-center">
                                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-700">No records found</h3>
                                    <p className="text-gray-500 mt-2">
                                        {recordSearchTerm
                                            ? `No results for "${recordSearchTerm}"`
                                            : 'This patient has no medical records yet'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredRecords && filteredRecords.map(record => (
                                        <div
                                            key={record._id}
                                            className="py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex items-start">
                                                <div className="bg-primary-50 p-3 rounded-lg mr-4">
                                                    <FileText className="h-6 w-6 text-primary-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium text-gray-800">{record.title}</h3>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(record.date), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {record.fileUrl && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            // Construct the full file URL using the backend URL and file path
                                                                            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
                                                                            const fileUrl = `${backendUrl}/medical-records/files/${record.fileUrl}`;
                                                                            window.open(fileUrl, "_blank");
                                                                        }}
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        View
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
                                                                                const fileUrl = `${backendUrl}/medical-records/files/${record.fileUrl}`;

                                                                                const response = await fetch(fileUrl, {
                                                                                    headers: {
                                                                                        'Authorization': `Bearer ${localStorage.getItem('healToken')}`,
                                                                                    },
                                                                                });

                                                                                if (!response.ok) {
                                                                                    throw new Error('Failed to download file');
                                                                                }

                                                                                const blob = await response.blob();
                                                                                const blobUrl = URL.createObjectURL(blob);

                                                                                const a = document.createElement('a');
                                                                                a.href = blobUrl;
                                                                                a.download = record.title
                                                                                    ? `${record.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                                                                                    : record.fileUrl || "medical_record.pdf";
                                                                                document.body.appendChild(a);
                                                                                a.click();

                                                                                setTimeout(() => {
                                                                                    document.body.removeChild(a);
                                                                                    URL.revokeObjectURL(blobUrl);
                                                                                }, 100);
                                                                            } catch (error) {
                                                                                console.error('Error downloading file:', error);
                                                                                alert('Failed to download the file. Please try again.');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Download className="h-4 w-4 mr-1" />
                                                                        Download
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600">{record.description}</p>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                                                            {record.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        </span>

                                                        {record.doctorId && (
                                                            <span className="text-xs text-gray-500">
                                                                {record.doctorId.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t">
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRecordsModal(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    );
};