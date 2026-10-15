import type { Metadata } from "next";
import { AppointmentsReadError } from "@/features/appointments/read-errors";
import { AppointmentsReadFailure } from "@/features/appointments/components/read-error";
import { CreateAppointmentForm } from "@/features/appointments/components/create-appointment-form";
import { getPatientsRepository } from "@/features/appointments/application.server";
import { getAppTodayIso } from "@/lib/app-date";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Novo agendamento" };

async function renderPage() {
  const todayIso = getAppTodayIso(new Date());
  const patients = await (await getPatientsRepository()).listPatients();
  // Only what the selector needs crosses to the browser.
  const options = patients.map(({ id, fullName, phone }) => ({ id, fullName, phone }));
  return <CreateAppointmentForm todayIso={todayIso} patients={options} />;
}

export default async function Page() {
  try { return await renderPage(); }
  catch (error) {
    if (error instanceof AppointmentsReadError) return <AppointmentsReadFailure code={error.code} />;
    throw error;
  }
}
