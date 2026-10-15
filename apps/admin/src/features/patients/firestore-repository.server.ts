import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { withDeadline } from "../appointments/firestore-repository.server";
import { patientFromFirestore } from "./firestore-mapper.server";
import type { PatientsRepository } from "./types";

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

// Infrastructure constructor. Application flows must enter through application.server.
export function createFirestorePatientsRepository(db: Firestore): PatientsRepository {
  return {
    listPatients: () => withDeadline(async () => {
      const snapshot = await db.collection("patients").get();
      return snapshot.docs.map((doc) => patientFromFirestore(doc.id, doc.data()))
        .sort((a, b) => collator.compare(a.fullName, b.fullName) || a.id.localeCompare(b.id));
    }),
  };
}
