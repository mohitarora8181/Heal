import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin, Check, X } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { format } from 'date-fns';
import { mockPatients, mockAppointments } from '../../../dummyData';
import { useAuth } from '../../auth/AuthContext';
import 'react-calendar/dist/Calendar.css';

export const DoctorAppointments = () => {
    const { currentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    if (!currentUser) return null;

    const appointments = mockAppointments
        .filter(appointment => appointment.doctorId === currentUser.id)
        .map(appointment => ({
            ...appointment,
            patient: mockPatients.find(patient => patient.id === appointment.patientId)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

    return (
        <PageLayout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                    <p className="text-gray-600 mt-1">Manage your patient appointments</p>
                </div>
            </div>

            <div className="flex w-full gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                >
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-800">Today's Schedule</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {appointments.map(({ id, date, duration, type, patient, isUrgent, status }) => (
                                    <motion.div
                                        key={id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 border border-gray-100 rounded-lg hover:border-primary-100 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            {patient && <Avatar user={patient} size="md" className="mr-4" />}
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <h3 className="font-medium text-gray-800">{patient?.name}</h3>
                                                    {isUrgent && (
                                                        <Badge variant="error" className="ml-2">
                                                            Urgent
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {patient?.medicalHistory || 'No medical history'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end mb-1">
                                                    <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                                                    <span className="text-sm text-gray-600">
                                                        {format(new Date(date), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end mb-1">
                                                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                                    <span className="text-sm text-gray-600">
                                                        {format(new Date(date), 'h:mm a')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {getAppointmentTypeIcon(type)}
                                                    <span className="text-sm text-gray-600 ml-1">
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end space-x-2">
                                            {status === 'scheduled' && (
                                                <>
                                                    <Button variant="outline" size="sm">
                                                        <X className="h-4 w-4 mr-1" />
                                                        Cancel
                                                    </Button>
                                                    <Button variant="primary" size="sm">
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Start Consultation
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageLayout>
    );
};