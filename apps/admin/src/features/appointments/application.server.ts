import "server-only";
import { cache } from "react";
import { requireAdmin } from "../../lib/auth/access.server";
import { getAdminFirestore } from "../../lib/firebase/admin.server";
import { createAppointmentsService } from "./service";
import { createFirestoreAppointmentsRepository } from "./firestore-repository.server";

// React cache is scoped to the server render, never a global dataset cache.
export const getAppointmentsService = cache(async () => {
  await requireAdmin();
  return createAppointmentsService(createFirestoreAppointmentsRepository(getAdminFirestore()));
});
