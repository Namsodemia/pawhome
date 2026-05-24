"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const clinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  status: z.enum(["acik", "nobetci", "kapali"]),
  rating: z.coerce.number().min(0).max(5).default(0),
  ratingCount: z.coerce.number().int().min(0).default(0),
  image: z.string().optional().or(z.literal("")),
});

export async function createClinic(formData: FormData) {
  await requireAdmin();
  const data = clinicSchema.parse(Object.fromEntries(formData));
  await prisma.clinic.create({
    data: {
      ...data,
      address: data.address || null,
      phone: data.phone || null,
      image: data.image || null,
    },
  });
  revalidatePath("/admin/clinics");
  revalidatePath("/app/klinikler");
  redirect("/admin/clinics");
}

export async function updateClinic(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  const data = clinicSchema.parse(Object.fromEntries(formData));
  await prisma.clinic.update({
    where: { id },
    data: {
      ...data,
      address: data.address || null,
      phone: data.phone || null,
      image: data.image || null,
    },
  });
  revalidatePath("/admin/clinics");
  revalidatePath("/app/klinikler");
  redirect("/admin/clinics");
}

export async function deleteClinic(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  await prisma.clinic.delete({ where: { id } });
  revalidatePath("/admin/clinics");
  revalidatePath("/app/klinikler");
}
