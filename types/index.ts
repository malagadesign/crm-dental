import {
  User,
  Clinic,
  Patient,
  Treatment,
  Appointment,
  MedicalRecord,
  Lead,
  AppointmentStatus,
  PatientOrigin,
  LeadOrigin,
  LeadStatus,
} from "@prisma/client";

export type {
  User,
  Clinic,
  Patient,
  Treatment,
  Appointment,
  MedicalRecord,
  Lead,
  AppointmentStatus,
  PatientOrigin,
  LeadOrigin,
  LeadStatus,
};

// User.role es string en Laravel, no enum
export type UserRole = "admin" | "secretary";

export interface AppointmentWithRelations extends Appointment {
  patient: Patient;
  clinic: Clinic;
  treatment: Treatment | null;
  user: User | null;
}

export interface PatientWithRelations extends Patient {
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
}

export interface MedicalRecordWithRelations extends MedicalRecord {
  patient: Patient;
  appointment: Appointment | null;
  user: User | null;
}

export interface LeadWithRelations extends Lead {
  patient: Patient | null;
}
