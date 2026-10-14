import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import type { AppointmentsRepository } from "./repository";
import type { Appointment } from "./types";
import { appointmentFromFirestore } from "./firestore-mapper.server";
import { AppointmentsReadError } from "./read-errors";

export async function readWithDeadline<T>(read: () => Promise<T>, milliseconds = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([read(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new AppointmentsReadError("UNAVAILABLE")), milliseconds);
    })]);
  } catch (error) {
    if (error instanceof AppointmentsReadError) throw error;
    throw new AppointmentsReadError("UNAVAILABLE");
  } finally { clearTimeout(timer); }
}

// Infrastructure constructor. Application flows must enter through application.server.
export function createFirestoreAppointmentsRepository(db: Firestore): AppointmentsRepository {
  let listing: Promise<Appointment[]> | undefined;
  const getAllAppointments = () => listing ??= readWithDeadline(async () => {
    const snapshot = await db.collection("appointments").get();
    return snapshot.docs.map((doc) => appointmentFromFirestore(doc.id, doc.data())).sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  });
  return {
    getAllAppointments,
    async getAppointmentsByDate(date) { return (await getAllAppointments()).filter((item) => item.date === date); },
    async getAppointmentById(id) {
      // A route parameter must identify one document, never a descendant path.
      if (!id || id.includes("/") || id === "." || id === "..") throw new AppointmentsReadError("DATA_INVALID");
      return readWithDeadline(async () => {
        const snapshot = await db.collection("appointments").doc(id).get();
        return snapshot.exists ? appointmentFromFirestore(snapshot.id, snapshot.data()) : undefined;
      });
    },
  };
}
