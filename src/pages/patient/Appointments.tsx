import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin, Plus } from 'lucide-react';
import { PageLayout } from '../../layouts/PageLayout';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import Calendar, { type CalendarProps } from 'react-calendar';
import { format } from 'date-fns';
import { mockDoctors, mockAppointments } from '../../../dummyData';
import { useAuth } from '../../auth/AuthContext';
import 'react-calendar/dist/Calendar.css';

export const Appointments = () => {
    const { currentUser } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    if (!currentUser) return null;

    const handleDateChange: CalendarProps['onChange'] = (value) => {
        if (value instanceof Date) {
            setSelectedDate(value);
        }
    };

    const appointments = mockAppointments
        .filter(appointment => appointment.patientId === currentUser.id)
        .map(appointment => ({
            ...appointment,
            doctor: mockDoctors.find(doctor => doctor.id === appointment.doctorId)
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
                    <p className="text-gray-600 mt-1">Manage your upcoming and past appointments</p>
                </div>
                <Button onClick={() => setShowScheduleForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {appointments.map(({ id, date, duration, type, doctor, isUrgent }) => (
                                    <motion.div
                                        key={id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 border border-gray-100 rounded-lg hover:border-primary-100 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            {doctor && <Avatar user={doctor} size="md" className="mr-4" />}
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <h3 className="font-medium text-gray-800">{doctor?.name}</h3>
                                                    {isUrgent && (
                                                        <Badge variant="error" className="ml-2">
                                                            Urgent
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{doctor?.specialization}</p>
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
                                            <Button variant="outline" size="sm">
                                                Reschedule
                                            </Button>
                                            <Button variant="primary" size="sm">
                                                Join {type === 'video' ? 'Video' : 'Audio'} Call
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-800">Calendar</h2>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                onChange={handleDateChange}
                                value={selectedDate}
                                className="w-full border-0 rounded-lg"
                            />
                            <div className="mt-4">
                                <h3 className="font-medium text-gray-800 mb-2">
                                    {format(selectedDate, 'MMMM d, yyyy')}
                                </h3>
                                <div className="space-y-2">
                                    {appointments
                                        .filter(
                                            app =>
                                                format(new Date(app.date), 'yyyy-MM-dd') ===
                                                format(selectedDate, 'yyyy-MM-dd')
                                        )
                                        .map(({ id, date, doctor, type }) => (
                                            <div
                                                key={id}
                                                className="flex items-center p-2 bg-gray-50 rounded-lg"
                                            >
                                                <div className="mr-2">
                                                    {getAppointmentTypeIcon(type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {format(new Date(date), 'h:mm a')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{doctor?.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageLayout>
    );
};