import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import UserEditForm from "./UserEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, avatar: true, role: true },
  });

  if (!user) notFound();

  return (
    <Suspense>
      <UserEditForm user={user} />
    </Suspense>
  );
}
