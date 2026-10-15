import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminConfig } from "@/lib/firebase/config.server";
import { requireAdminApi, type AdminIdentity } from "@/lib/auth/access.server";
import { authErrorResponse, protectPost, PRIVATE_HEADERS } from "@/lib/auth/http.server";
import { readJsonBody } from "@/lib/http/json-body.server";
import { createAppointmentAsAdmin } from "@/features/appointments/application.server";
import { parseCreateAppointmentRequest } from "@/features/appointments/create-request";
import { appointmentWriteFailure, appointmentWriteStatus, type AppointmentWriteError } from "@/features/appointments/write-errors";

export const runtime = "nodejs";

function errorResponse(error: AppointmentWriteError) {
  return NextResponse.json(error, { status: appointmentWriteStatus(error.code), headers: PRIVATE_HEADERS });
}

export async function POST(request: NextRequest) {
  let identity: AdminIdentity;
  try {
    protectPost(request, getAdminConfig());
    identity = await requireAdminApi();
  } catch (error) { return authErrorResponse(error); }

  let body: unknown;
  try { body = await readJsonBody(request, 16_384); }
  catch { return errorResponse(appointmentWriteFailure("INVALID_BODY").error); }
  const parsed = parseCreateAppointmentRequest(body);
  if (!parsed.ok) return errorResponse(parsed.error);

  const result = await createAppointmentAsAdmin(identity, parsed.value);
  if (!result.ok) return errorResponse(result.error);
  const location = `/admin/agendamentos/${result.appointmentId}`;
  return NextResponse.json({ id: result.appointmentId, replayed: result.replayed }, {
    status: result.replayed ? 200 : 201,
    headers: { ...PRIVATE_HEADERS, ...(result.replayed ? {} : { Location: location }) },
  });
}
