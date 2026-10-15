import "server-only";
import type { NextRequest } from "next/server";
import { AdminAuthError } from "../auth/errors";

// Bound allocation before parsing an untrusted body, including chunked requests.
export async function readJsonBody(request: NextRequest, limit: number): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new AdminAuthError(400, "INVALID_BODY");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AdminAuthError(400, "INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new AdminAuthError(400, "INVALID_BODY");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new AdminAuthError(400, "INVALID_BODY"); }
}
