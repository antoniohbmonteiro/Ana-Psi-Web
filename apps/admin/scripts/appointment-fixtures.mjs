import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createMockAppointments } = require("../.next/persistence-tests/features/appointments/mock.js");
const { appointmentToFirestore } = require("../.next/persistence-tests/features/appointments/firestore-mapper.server.js");

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
