import React from "react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Log In | Veklom Capability OS",
};

export default function LoginPage() {
  return (
    <HumanAppShell>
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-10 sm:py-24 w-full min-w-0">
        <LoginForm />
      </div>
    </HumanAppShell>
  );
}
