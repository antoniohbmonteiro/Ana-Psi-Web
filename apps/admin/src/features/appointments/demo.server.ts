import "server-only";
import { requireAdmin } from "../../lib/auth/access.server";
import { getAdminConfig } from "../../lib/firebase/config.server";
import { createAppointmentsService } from "./service";
import { createAppointmentsRepository } from "./repository";
import { createMockAppointments } from "./mock";

export async function getDemoAppointmentsService(now: Date) {
  await requireAdmin();
  if (!getAdminConfig().demoAppointments) {
    throw new Error("APPOINTMENTS_PERSISTENCE_NOT_CONFIGURED");
  }
  return createAppointmentsService(now, createAppointmentsRepository(now, createMockAppointments(now)));
}
