import { redirect } from "next/navigation";

export default function VeklomDiscoveryPage() {
  // The old marketplace and sandbox discovery page has been deprecated.
  // Veklom Discovery is now purely the Base App Identity registry.
  redirect("https://veklomdiscovery.vercel.app");
}
