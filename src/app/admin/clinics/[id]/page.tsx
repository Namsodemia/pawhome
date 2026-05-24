import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClinicForm } from "../ClinicForm";
import { updateClinic } from "../actions";

export default async function EditClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { id: Number(id) } });
  if (!clinic) notFound();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Klinik Düzenle</h1>
      <ClinicForm action={updateClinic} initial={clinic} submitLabel="Güncelle" />
    </div>
  );
}
