import { redirect } from "next/navigation";

export const metadata = {
  title: "Live Activation | Veklom",
};

export default function GovernedMachineDemoRedirect() {
  redirect("/activate");
}
