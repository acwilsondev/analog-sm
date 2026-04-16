import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { redirect } from "next/navigation";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <SearchClient />;
}
