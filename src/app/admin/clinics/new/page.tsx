import { ClinicForm } from "../ClinicForm";
import { createClinic } from "../actions";

export default function NewClinicPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Yeni Klinik</h1>
      <ClinicForm action={createClinic} submitLabel="Oluştur" />
    </div>
  );
}
