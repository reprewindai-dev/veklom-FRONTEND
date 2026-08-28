import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: 'Log In | Veklom Capability OS',
};

export default function LoginPage() {
  return (
    <HumanAppShell>
      <div className="flex-1 flex items-center justify-center p-6 w-full py-24">
        <LoginForm />
      </div>
    </HumanAppShell>
  );
}
