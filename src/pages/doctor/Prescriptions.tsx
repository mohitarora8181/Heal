import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Download, Plus, X, PlusCircle, Trash2 } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { format } from 'date-fns';
import { useAuth } from '../../auth/AuthContext';
import { handleDownloadPrescription } from '../../utils/downloadPrescription';

// Define interfaces
interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
}

interface Prescription {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        email: string;
    };
    doctorId: {
        _id: string;
        name: string;
        email?: string;
    };
    medications: Medication[];
    instructions: string;
    date: Date;
    refillable: boolean;
    refills: number;
}

interface Patient {
    _id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
    role: string;
}

export const DoctorPrescriptions = () => {
    // Auth context for current user
    const { currentUser } = useAuth();

    // States for prescriptions data and UI
    const [searchTerm, setSearchTerm] = useState('');
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientMap, setPatientMap] = useState<Record<string, Patient>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // States for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // New prescription form state
    const [newPrescription, setNewPrescription] = useState<Omit<Prescription, '_id'>>({
        patientId: { _id: "", name: "", email: "" },
        doctorId: { _id: currentUser?._id || "", name: currentUser?.name || "", email: currentUser?.email },
        medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
        instructions: '',
        date: new Date(),
        refillable: false,
        refills: 0
    });

    // State for delete confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // States for edit mode
    const [editMode, setEditMode] = useState(false);
    const [prescriptionToEdit, setPrescriptionToEdit] = useState<string | null>(null);

    // Fetch prescriptions and patients on component mount
    useEffect(() => {
        fetchPrescriptions();
        fetchPatients();
    }, []);

    // Create a map of patient IDs to patient data for easy lookup
    useEffect(() => {
        const map: Record<string, Patient> = {};
        patients.forEach(patient => {
            map[patient._id] = patient;
        });
        setPatientMap(map);
    }, [patients]);

    // Fetch prescriptions from API
    const fetchPrescriptions = async () => {
        setLoading(true);
        setError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${backendUrl}/prescriptions?userRole=doctor&userId=${currentUser?._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch prescriptions');
            }

            const data = await response.json();
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setError('Failed to load prescriptions. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch patients from API
    const fetchPatients = async () => {
        setLoadingPatients(true);

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
            const patientsList = Array.isArray(data) ? data : data.users || [];
            setPatients(patientsList);
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Handle patient selection
    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowPatientDropdown(false);
        setNewPrescription((prev: any) => ({
            ...prev,
            patientId: patient._id
        }));
    };

    // Handle input changes for form fields
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setNewPrescription(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : value
        }));
    };

    // Handle medication field changes
    const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
        setNewPrescription(prev => {
            const updatedMedications = [...prev.medications];
            updatedMedications[index] = {
                ...updatedMedications[index],
                [field]: value
            };
            return {
                ...prev,
                medications: updatedMedications
            };
        });
    };

    // Add a new medication field
    const addMedication = () => {
        setNewPrescription(prev => ({
            ...prev,
            medications: [
                ...prev.medications,
                { name: '', dosage: '', frequency: '', duration: '', notes: '' }
            ]
        }));
    };

    // Remove a medication field
    const removeMedication = (index: number) => {
        if (newPrescription.medications.length <= 1) return; // Keep at least one medication

        setNewPrescription(prev => {
            const updatedMedications = [...prev.medications];
            updatedMedications.splice(index, 1);
            return {
                ...prev,
                medications: updatedMedications
            };
        });
    };

    // Handle prescription deletion
    const handleDeletePrescription = async (id: string) => {
        setIsDeleting(true);
        setDeleteError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${backendUrl}/prescriptions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete prescription');
            }

            // Remove the deleted prescription from state
            setPrescriptions(prev => prev.filter(p => p._id !== id));

            // Close confirmation modal
            setShowDeleteConfirm(false);
            setPrescriptionToDelete(null);

        } catch (error: any) {
            console.error('Error deleting prescription:', error);
            setDeleteError(error.message || 'Failed to delete prescription');
        } finally {
            setIsDeleting(false);
        }
    };

    // Reset the form
    const resetForm = () => {
        setNewPrescription({
            patientId: { _id: "", name: "", email: "" },
            doctorId: { _id: currentUser?._id || "", name: currentUser?.name || "", email: currentUser?.email },
            medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
            instructions: '',
            date: new Date(),
            refillable: false,
            refills: 0
        });
        setSelectedPatient(null);
        setPatientSearchTerm('');
        setEditMode(false);
        setPrescriptionToEdit(null);
    };

    // Add a function to load prescription data for editing
    const handleEditPrescription = (prescription: Prescription) => {
        // Find the patient in our patients list
        const patient = patientMap[prescription.patientId._id];
        if (patient) {
            setSelectedPatient(patient);
        }

        // Set the form data with the existing prescription
        setNewPrescription({
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            medications: prescription.medications,
            instructions: prescription.instructions,
            date: new Date(prescription.date),
            refillable: prescription.refillable,
            refills: prescription.refills
        });

        // Set edit mode
        setEditMode(true);
        setPrescriptionToEdit(prescription._id);
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFormError('');

        // Validate form
        if (!selectedPatient) {
            setFormError('Please select a patient');
            setIsSaving(false);
            return;
        }

        if (newPrescription.medications.some(med =>
            !med.name || !med.dosage || !med.frequency || !med.duration)) {
            setFormError('Please fill out all required medication fields');
            setIsSaving(false);
            return;
        }

        if (!newPrescription.instructions) {
            setFormError('Please provide instructions');
            setIsSaving(false);
            return;
        }

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const token = localStorage.getItem('healToken');

            if (!token) {
                throw new Error('Authentication required');
            }

            // Prepare the prescription data
            const prescriptionData = {
                ...newPrescription,
                patientId: selectedPatient._id, // Use the selected patient's ID
                doctorId: currentUser?._id,
                date: new Date(newPrescription.date).toISOString()
            };

            // Determine if this is a create or update
            const method = editMode ? 'PUT' : 'POST';
            const url = editMode
                ? `${backendUrl}/prescriptions/${prescriptionToEdit}`
                : `${backendUrl}/prescriptions`;

            // Send the data to the backend
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prescriptionData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to ${editMode ? 'update' : 'create'} prescription`);
            }

            const resultPrescription = await response.json();

            resultPrescription.patientId = { _id: selectedPatient._id, name: selectedPatient.name };

            // Update the UI with the new or updated prescription
            if (editMode) {
                setPrescriptions(prev => prev.map(p =>
                    p._id === prescriptionToEdit ? resultPrescription : p
                ));
            } else {
                setPrescriptions(prev => [...prev, resultPrescription]);
            }

            // Close modal and reset form
            setIsModalOpen(false);
            resetForm();

        } catch (error: any) {
            console.error(`Error ${editMode ? 'updating' : 'creating'} prescription:`, error);
            setFormError(error.message || `Failed to ${editMode ? 'update' : 'create'} prescription`);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter prescriptions based on search term
    const filteredPrescriptions = prescriptions.filter(prescription => {
        const patient = patientMap[prescription.patientId._id];
        const patientName = patient?.name?.toLowerCase() || '';

        // Search in patient name and medications
        return patientName.includes(searchTerm.toLowerCase()) ||
            prescription.medications.some(med =>
                med.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
    });

    // Filter patients for dropdown based on search term
    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
                    <p className="text-gray-600 mt-1">Manage and issue patient prescriptions</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                </Button>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search prescriptions..."
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
            ) : filteredPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No prescriptions found</h3>
                    <p className="text-gray-500 mt-2">
                        {searchTerm ? `No results for "${searchTerm}"` : 'Create your first prescription by clicking the button above'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredPrescriptions.map((prescription) => {
                        const patient = patientMap[prescription.patientId._id];
                        return (
                            <motion.div
                                key={prescription._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-start">
                                            <div className="bg-primary-50 p-3 rounded-lg mr-4">
                                                <FileText className="h-6 w-6 text-primary-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        {patient && <Avatar user={patient} size="sm" className="mr-2" />}
                                                        <div>
                                                            <h3 className="font-medium text-gray-800">{patient?.name || 'Unknown Patient'}</h3>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(prescription.date), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadPrescription(prescription)}
                                                        >
                                                            <Download className="h-4 w-4 mr-1" />
                                                            Download
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditPrescription(prescription)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-error-600 hover:bg-error-50 border-error-200"
                                                            onClick={() => {
                                                                setPrescriptionToDelete(prescription._id);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                                                    <div className="space-y-2">
                                                        {prescription.medications.map((med, index) => (
                                                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <h5 className="font-medium text-gray-800">{med.name}</h5>
                                                                    <span className="text-sm text-gray-600">{med.dosage}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {med.frequency} • {med.duration}
                                                                </p>
                                                                {med.notes && (
                                                                    <p className="text-sm text-gray-500 mt-1">{med.notes}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
                                                    <p className="text-sm text-gray-600">{prescription.instructions}</p>
                                                </div>

                                                {prescription.refillable && (
                                                    <div className="mt-4 flex items-center">
                                                        <span className="text-sm text-gray-600">
                                                            Refills remaining: {prescription.refills}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* New Prescription Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">{editMode ? 'Edit Prescription' : 'New Prescription'}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit}>
                                <div className="p-6">
                                    {formError && (
                                        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md">
                                            <p className="text-error-700">{formError}</p>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Patient Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Patient*
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="Search patients..."
                                                    value={patientSearchTerm}
                                                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                                                    onFocus={() => setShowPatientDropdown(true)}
                                                    fullWidth
                                                />
                                                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />

                                                {showPatientDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                                                        {loadingPatients ? (
                                                            <div className="p-4 text-center text-gray-500">
                                                                <div className="animate-spin inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                                                                <span className="ml-2">Loading patients...</span>
                                                            </div>
                                                        ) : filteredPatients.length === 0 ? (
                                                            <div className="p-4 text-center text-gray-500">
                                                                No patients found
                                                            </div>
                                                        ) : (
                                                            <ul>
                                                                {filteredPatients.map(patient => (
                                                                    <li
                                                                        key={patient._id}
                                                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
                                                                        onClick={() => handlePatientSelect(patient)}
                                                                    >
                                                                        <Avatar user={patient} size="sm" className="mr-3" />
                                                                        <div>
                                                                            <div className="font-medium">{patient.name}</div>
                                                                            <div className="text-xs text-gray-500">{patient.email}</div>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        <div className="p-2 border-t border-gray-100">
                                                            <button
                                                                type="button"
                                                                className="w-full text-xs text-gray-500 hover:text-gray-700 text-center p-2"
                                                                onClick={() => setShowPatientDropdown(false)}
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedPatient && (
                                                <div className="mt-2 p-3 bg-gray-50 rounded-md flex items-center">
                                                    <Avatar user={selectedPatient} size="sm" className="mr-3" />
                                                    <div>
                                                        <div className="font-medium">{selectedPatient.name}</div>
                                                        <div className="text-xs text-gray-500">{selectedPatient.email}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                                Date*
                                            </label>
                                            <Input
                                                id="date"
                                                name="date"
                                                type="date"
                                                value={new Date(newPrescription.date).toISOString().split('T')[0]}
                                                onChange={handleInputChange}
                                                required
                                                fullWidth
                                            />
                                        </div>

                                        {/* Medications */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Medications*
                                                </label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addMedication}
                                                >
                                                    <PlusCircle className="h-4 w-4 mr-1" />
                                                    Add Medication
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                {newPrescription.medications.map((med, index) => (
                                                    <div key={index} className="bg-gray-50 p-4 rounded-lg relative">
                                                        {newPrescription.medications.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="absolute top-2 right-2 text-gray-400 hover:text-error-500"
                                                                onClick={() => removeMedication(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Medication Name*
                                                                </label>
                                                                <Input
                                                                    value={med.name}
                                                                    onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                                                    placeholder="e.g. Amoxicillin"
                                                                    required
                                                                    fullWidth
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Dosage*
                                                                </label>
                                                                <Input
                                                                    value={med.dosage}
                                                                    onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                                    placeholder="e.g. 500mg"
                                                                    required
                                                                    fullWidth
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Frequency*
                                                                </label>
                                                                <Input
                                                                    value={med.frequency}
                                                                    onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                                                    placeholder="e.g. 3 times daily"
                                                                    required
                                                                    fullWidth
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Duration*
                                                                </label>
                                                                <Input
                                                                    value={med.duration}
                                                                    onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                                                    placeholder="e.g. 7 days"
                                                                    required
                                                                    fullWidth
                                                                />
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Notes (Optional)
                                                                </label>
                                                                <textarea
                                                                    value={med.notes}
                                                                    onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                                                                    placeholder="Additional instructions"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Instructions */}
                                        <div>
                                            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
                                                Instructions*
                                            </label>
                                            <textarea
                                                id="instructions"
                                                name="instructions"
                                                value={newPrescription.instructions}
                                                onChange={handleInputChange}
                                                placeholder="General instructions for the patient"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                rows={4}
                                                required
                                            />
                                        </div>

                                        {/* Refills */}
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    id="refillable"
                                                    name="refillable"
                                                    type="checkbox"
                                                    checked={newPrescription.refillable}
                                                    onChange={(e) =>
                                                        setNewPrescription(prev => ({
                                                            ...prev,
                                                            refillable: e.target.checked
                                                        }))
                                                    }
                                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                />
                                                <label htmlFor="refillable" className="ml-2 block text-sm text-gray-700">
                                                    Allow Refills
                                                </label>
                                            </div>

                                            {newPrescription.refillable && (
                                                <div>
                                                    <label htmlFor="refills" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Number of Refills
                                                    </label>
                                                    <Input
                                                        id="refills"
                                                        name="refills"
                                                        type="number"
                                                        min="0"
                                                        max="12"
                                                        value={newPrescription.refills}
                                                        onChange={handleInputChange}
                                                        fullWidth
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t bg-gray-50">
                                    <div className="flex justify-end space-x-3">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSaving || !selectedPatient}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>{editMode ? 'Update Prescription' : 'Create Prescription'}</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-lg w-full max-w-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Prescription</h3>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this prescription? This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                                    <p className="text-error-700 text-sm">{deleteError}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setPrescriptionToDelete(null);
                                        setDeleteError('');
                                    }}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="bg-error-600 hover:bg-error-700 text-white"
                                    onClick={() => prescriptionToDelete && handleDeletePrescription(prescriptionToDelete)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>Delete</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    );
};