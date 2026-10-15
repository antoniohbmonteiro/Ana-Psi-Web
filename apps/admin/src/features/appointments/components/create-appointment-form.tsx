"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminPostJson } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import type { PatientOption } from "../../patients/types";
import { CREATE_APPOINTMENT_LIMITS, parseBrlAmountToCents, parseCreateAppointmentRequest } from "../create-request";
import type { AppointmentModality, AppointmentSessionType } from "../types";
import { APPOINTMENT_TEXT_LIMITS } from "../validation";

type Props = { todayIso: string; patients: PatientOption[] };
type FieldErrors = Record<string, string>;
type PatientMode = "new" | "existing";
type ResponseBody = {
  id?: unknown; code?: unknown; message?: unknown; fieldErrors?: unknown; appointmentId?: unknown;
};

// Request keys follow the API contract; inputs use flat names.
const inputNames: Record<string, string> = {
  "patient.fullName": "fullName", "patient.phone": "phone", "patient.email": "email",
  "patient.id": "patientId", "patient.mode": "patientMode", patient: "patientMode",
};

function toInputErrors(errors: unknown): FieldErrors {
  if (!errors || typeof errors !== "object") return {};
  return Object.fromEntries(Object.entries(errors as Record<string, unknown>)
    .filter(([, message]) => typeof message === "string")
    .map(([key, message]) => [inputNames[key] ?? key, message as string]));
}

function errorProps(name: string, errors: FieldErrors) {
  return errors[name]
    ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
    : { "aria-invalid": false };
}

function Field({ name, label, errors, hint, className, children }: {
  name: string; label: string; errors: FieldErrors; hint?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={`appointment-${name}`} className="app-label">{label}</label>
      {children}
      {errors[name] ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs" style={{ color: "var(--destructive-text)" }}>{errors[name]}</p>
      ) : hint ? <p className="mt-1.5 text-xs app-muted">{hint}</p> : null}
    </div>
  );
}

function SelectInput(props: React.ComponentProps<typeof Select>) {
  return (
    <div className="relative">
      <Select {...props} className={cn("pr-10", props.className)} />
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 app-muted" />
    </div>
  );
}

function invalidStyle(name: string, errors: FieldErrors) {
  return errors[name] ? { borderColor: "var(--destructive)" } : undefined;
}

export function CreateAppointmentForm({ todayIso, patients }: Props) {
  const [mode, setMode] = useState<PatientMode>("new");
  const [modality, setModality] = useState<AppointmentModality>("online");
  const [sessionType, setSessionType] = useState<AppointmentSessionType>("initial");
  const sessionTypeChosen = useRef(false);
  // One request ID per intended appointment: retries after failures reuse it and can never duplicate.
  const requestId = useRef<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string>();
  const [existingAppointmentId, setExistingAppointmentId] = useState<string>();
  const [sessionExpired, setSessionExpired] = useState(false);

  function choosePatientMode(next: PatientMode) {
    setMode(next);
    setErrors({});
    if (!sessionTypeChosen.current) setSessionType(next === "new" ? "initial" : "follow_up");
  }

  function showErrors(form: HTMLFormElement, fieldErrors: FieldErrors, text: string) {
    setErrors(fieldErrors);
    setMessage(text);
    requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "");
    const localErrors: FieldErrors = {};
    const amount = text("amount").trim() ? parseBrlAmountToCents(text("amount")) : undefined;
    if (amount === undefined) localErrors.amount = "Informe o valor no formato 150,00.";
    const durationText = text("duration").trim();
    if (text("date") && text("date") < todayIso) localErrors.date = "Escolha uma data a partir de hoje.";
    requestId.current ??= crypto.randomUUID();
    const parsed = parseCreateAppointmentRequest({
      requestId: requestId.current,
      patient: mode === "new"
        ? { mode, fullName: text("fullName"), phone: text("phone"), email: text("email") }
        : { mode, id: text("patientId") },
      date: text("date"), time: text("time"), duration: /^\d+$/.test(durationText) ? Number(durationText) : Number.NaN,
      modality, sessionType, status: text("status"), amount: amount ?? Number.NaN, method: text("method"),
      ...(modality === "online" ? { meetingLink: text("meetingLink") } : {}),
      notes: text("notes"),
    });
    const fieldErrors = { ...(parsed.ok ? {} : toInputErrors(parsed.error.fieldErrors)), ...localErrors };
    setExistingAppointmentId(undefined);
    setSessionExpired(false);
    if (!parsed.ok || Object.keys(fieldErrors).length) {
      showErrors(form, fieldErrors, "Revise os campos destacados.");
      return;
    }

    setPending(true);
    setErrors({});
    setMessage(undefined);
    try {
      const { status, data: response } = await adminPostJson("/api/admin/agendamentos", parsed.value);
      const body: ResponseBody = response && typeof response === "object" ? response : {};
      if ((status === 201 || status === 200) && typeof body.id === "string") {
        requestId.current = undefined;
        window.location.assign(`/admin/agendamentos/${encodeURIComponent(body.id)}?criado=1`);
        return; // Stay pending while the browser navigates.
      }
      if (status === 401) {
        setSessionExpired(true);
        setMessage("Sua sessão expirou. Entre novamente para continuar; este agendamento ainda não foi salvo.");
      } else if (status === 403) {
        setMessage("Acesso não autorizado. Recarregue a página e tente novamente.");
      } else {
        const serverErrors = toInputErrors(body.fieldErrors);
        if (body.code === "SCHEDULE_CONFLICT") serverErrors.time = "Este horário conflita com outro atendimento.";
        if (body.code === "INVALID_OPERATION_TIME") serverErrors.time = "Escolha um horário no futuro.";
        if (body.code === "PATIENT_NOT_FOUND") serverErrors.patientId = "Paciente não encontrado.";
        if (body.code === "IDEMPOTENCY_KEY_REUSED" && typeof body.appointmentId === "string") setExistingAppointmentId(body.appointmentId);
        // The key is unusable for this session and wrote nothing here, so the next attempt gets a fresh one.
        if (body.code === "IDEMPOTENCY_KEY_CONFLICT") requestId.current = undefined;
        showErrors(form, serverErrors, typeof body.message === "string" ? body.message : "Não foi possível salvar o agendamento.");
      }
    } catch {
      setMessage("Não foi possível confirmar o agendamento. Verifique a conexão e tente novamente; o reenvio não duplica o agendamento.");
    }
    setPending(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-page-title">Novo Agendamento</h1>
        <p className="mt-1 text-page-subtitle">Cadastre um atendimento na agenda do consultório</p>
      </div>

      <fieldset disabled={pending} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-section-title">Paciente</h2>
                <p className="mt-1 text-sm app-muted">Cadastre uma pessoa nova ou escolha um cadastro existente</p>
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--accent)" }}>
                {([["new", "Novo paciente"], ["existing", "Já cadastrado"]] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    disabled={value === "existing" && patients.length === 0}
                    onClick={() => choosePatientMode(value)}
                    className={cn(
                      "h-10 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                      mode === value ? "bg-white shadow-sm" : "app-muted hover:text-[var(--foreground)]"
                    )}
                    style={mode === value ? { color: "var(--foreground)" } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {patients.length === 0 ? <p className="text-xs app-muted">Ainda não há pacientes cadastrados.</p> : null}

              {mode === "new" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field name="fullName" label="Nome completo" errors={errors} className="md:col-span-2">
                    <Input id="appointment-fullName" name="fullName" autoComplete="off" required
                      maxLength={APPOINTMENT_TEXT_LIMITS.fullName} style={invalidStyle("fullName", errors)} {...errorProps("fullName", errors)} />
                  </Field>
                  <Field name="phone" label="Telefone" errors={errors} hint="Com DDD">
                    <Input id="appointment-phone" name="phone" type="tel" inputMode="tel" autoComplete="off" required
                      placeholder="(31) 99999-9999" maxLength={APPOINTMENT_TEXT_LIMITS.phone}
                      style={invalidStyle("phone", errors)} {...errorProps("phone", errors)} />
                  </Field>
                  <Field name="email" label="E-mail (opcional)" errors={errors}>
                    <Input id="appointment-email" name="email" type="email" autoComplete="off"
                      maxLength={APPOINTMENT_TEXT_LIMITS.email} style={invalidStyle("email", errors)} {...errorProps("email", errors)} />
                  </Field>
                </div>
              ) : (
                <Field name="patientId" label="Paciente cadastrado" errors={errors}>
                  <SelectInput id="appointment-patientId" name="patientId" required defaultValue=""
                    style={invalidStyle("patientId", errors)} {...errorProps("patientId", errors)}>
                    <option value="" disabled>Selecione o paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.phone}</option>
                    ))}
                  </SelectInput>
                </Field>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-section-title">Sessão</h2>
                <p className="mt-1 text-sm app-muted">Data, horário e formato do atendimento</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <Field name="date" label="Data" errors={errors}>
                  <Input id="appointment-date" name="date" type="date" min={todayIso} required
                    style={invalidStyle("date", errors)} {...errorProps("date", errors)} />
                </Field>
                <Field name="time" label="Horário" errors={errors}>
                  <Input id="appointment-time" name="time" type="time" step={60} required
                    style={invalidStyle("time", errors)} {...errorProps("time", errors)} />
                </Field>
                <Field name="duration" label="Duração (minutos)" errors={errors}>
                  <Input id="appointment-duration" name="duration" type="number" inputMode="numeric" required
                    min={1} max={CREATE_APPOINTMENT_LIMITS.durationMax} step={1} defaultValue={50}
                    style={invalidStyle("duration", errors)} {...errorProps("duration", errors)} />
                </Field>
                <Field name="modality" label="Modalidade" errors={errors}>
                  <SelectInput id="appointment-modality" name="modality" value={modality}
                    onChange={(event) => setModality(event.target.value as AppointmentModality)} {...errorProps("modality", errors)}>
                    <option value="online">Online</option>
                    <option value="in_person">Presencial</option>
                  </SelectInput>
                </Field>
                <Field name="sessionType" label="Tipo" errors={errors}>
                  <SelectInput id="appointment-sessionType" name="sessionType" value={sessionType}
                    onChange={(event) => { sessionTypeChosen.current = true; setSessionType(event.target.value as AppointmentSessionType); }}
                    {...errorProps("sessionType", errors)}>
                    <option value="initial">Primeira Sessão</option>
                    <option value="follow_up">Retorno</option>
                  </SelectInput>
                </Field>
                <Field name="status" label="Status inicial" errors={errors}>
                  <SelectInput id="appointment-status" name="status" defaultValue="confirmed" {...errorProps("status", errors)}>
                    <option value="confirmed">Confirmado</option>
                    <option value="pending">Pendente</option>
                  </SelectInput>
                </Field>
                {modality === "online" ? (
                  <Field name="meetingLink" label="Link da sessão (opcional)" errors={errors} className="md:col-span-2 2xl:col-span-3">
                    <Input id="appointment-meetingLink" name="meetingLink" type="url" inputMode="url" placeholder="https://"
                      maxLength={APPOINTMENT_TEXT_LIMITS.meetingLink} style={invalidStyle("meetingLink", errors)} {...errorProps("meetingLink", errors)} />
                  </Field>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-section-title">Pagamento</h2>
                <p className="mt-1 text-sm app-muted">O pagamento é registrado como pendente</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="amount" label="Valor (R$)" errors={errors}>
                  <Input id="appointment-amount" name="amount" inputMode="decimal" autoComplete="off" required placeholder="150,00"
                    style={invalidStyle("amount", errors)} {...errorProps("amount", errors)} />
                </Field>
                <Field name="method" label="Forma de pagamento" errors={errors}>
                  <SelectInput id="appointment-method" name="method" defaultValue="pix" {...errorProps("method", errors)}>
                    <option value="pix">PIX</option>
                    <option value="payment_link">Link de pagamento</option>
                    <option value="cash">Dinheiro</option>
                  </SelectInput>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="text-section-title">Observações</h2>
                <p className="mt-1 text-sm app-muted">Informações administrativas internas (opcional)</p>
              </div>
              <Field name="notes" label="Observações" errors={errors}>
                <Textarea id="appointment-notes" name="notes" maxLength={APPOINTMENT_TEXT_LIMITS.notes} {...errorProps("notes", errors)} />
              </Field>
            </CardContent>
          </Card>
        </div>
      </fieldset>

      {message ? (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(232,93,117,0.08)", borderColor: "rgba(232,93,117,0.30)", color: "var(--foreground)" }}
        >
          {message}
          {existingAppointmentId ? (
            <> <Link href={`/admin/agendamentos/${encodeURIComponent(existingAppointmentId)}`} className="font-medium underline">Ver agendamento criado</Link></>
          ) : null}
          {sessionExpired ? <> <Link href="/admin/entrar?motivo=sessao" className="font-medium underline">Entrar novamente</Link></> : null}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href="/admin/agenda" variant="secondary" className="rounded-xl">Cancelar</ButtonLink>
        <Button type="submit" className="rounded-xl" disabled={pending}>{pending ? "Salvando…" : "Salvar agendamento"}</Button>
      </div>
    </form>
  );
}
