import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createMockAppointments } = require("../.next/persistence-tests/features/appointments/mock.js");
const { appointmentToFirestore } = require("../.next/persistence-tests/features/appointments/firestore-mapper.server.js");
const { patientToFirestore } = require("../.next/persistence-tests/features/patients/firestore-mapper.server.js");

export function fictitiousAppointments(now = new Date()) {
  const appointments = createMockAppointments(now);
  const base = appointments[1];
  return [...appointments, ...["10:17", "07:15", "23:45"].map((time, index) => ({
    ...base, id: `local-minute-${index}`, time, duration: 15,
    patient: { id: `local-patient-${index}`, fullName: `Paciente fictício ${index + 1}`, relationship: "new" },
  }))];
}

export async function putFictitiousAppointments(db, appointments = fictitiousAppointments()) {
  const batch = db.batch();
  for (const appointment of appointments) batch.set(db.collection("appointments").doc(appointment.id), appointmentToFirestore(appointment));
  await batch.commit();
  return appointments;
}

// Registrations for fixture patients with a phone, so the form can select an existing patient locally.
export function fictitiousPatients(appointments = fictitiousAppointments(), now = new Date()) {
  const registeredAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const patients = new Map();
  for (const { patient } of appointments) {
    if (!patient.phone || patients.has(patient.id)) continue;
    patients.set(patient.id, {
      id: patient.id, version: 1, fullName: patient.fullName, phone: patient.phone,
      ...(patient.email ? { email: patient.email } : {}),
      createdAt: registeredAt, createdBy: "local-fixture", updatedAt: registeredAt,
    });
  }
  return [...patients.values()];
}

export async function putFictitiousPatients(db, patients = fictitiousPatients()) {
  const batch = db.batch();
  for (const patient of patients) batch.set(db.collection("patients").doc(patient.id), patientToFirestore(patient));
  await batch.commit();
  return patients;
}
