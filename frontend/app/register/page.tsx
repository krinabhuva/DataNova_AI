import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}