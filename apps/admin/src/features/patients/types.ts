// Minimal administrative registration. Appointments keep their own historical snapshot of these fields.
export type Patient = {
  id: string;
  version: number;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string; // ISO 8601 UTC instant ending in Z.
  createdBy: string;
  updatedAt: string; // ISO 8601 UTC instant ending in Z.
};

export type PatientOption = Pick<Patient, "id" | "fullName" | "phone">;

export type PatientsRepository = {
  listPatients(): Promise<Patient[]>;
};
