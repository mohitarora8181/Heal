export type UserRole = 'patient' | 'doctor';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string | UserRole;
    profileImageUrl?: string;
}

export interface Patient extends User {
    role: 'patient';
    medicalHistory?: string;
    allergies?: string[];
    medications?: Medication[];
    appointments?: Appointment[];
}

export interface Doctor extends User {
    role: 'doctor';
    specialization: string;
    qualifications: string[];
    certifications: string[];
    availability: Availability[];
    appointments?: Appointment[];
    rating?: number;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
}

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: Date;
    duration: number; // in minutes
    status: 'scheduled' | 'completed' | 'cancelled';
    type: 'video' | 'audio' | 'in-person';
    notes?: string;
    isUrgent?: boolean;
}

export interface Availability {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string; // format: "HH:MM"
    endTime: string; // format: "HH:MM"
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    doctorId: string;
    date: Date;
    title: string;
    description: string;
    fileUrl?: string;
    type: 'lab_report' | 'prescription' | 'scan' | 'other';
}

export interface Prescription {
    id: string;
    patientId: string;
    doctorId: string;
    date: Date;
    medications: PrescribedMedication[];
    instructions: string;
    refillable: boolean;
    refills?: number;
}

export interface PrescribedMedication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    read: boolean;
    attachmentUrl?: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'appointment' | 'message' | 'prescription' | 'system';
    actionUrl?: string;
}

export interface Payment {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    date: Date;
    method: 'card' | 'bank' | 'wallet';
    description: string;
}