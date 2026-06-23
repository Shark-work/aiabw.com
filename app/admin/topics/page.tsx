import { redirect } from "next/navigation";
import { AdminTopicsClient } from "./topics-client";

function isAdmin(email?: string) {
  return Boolean(email && process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
}

export default function AdminTopicsPage({ searchParams }: { searchParams?: { email?: string } }) {
  const email = searchParams?.email;
  if (!isAdmin(email)) redirect("/");

  return <AdminTopicsClient email={email!} />;
}
