"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { useModalClose } from "@/components/layout/LoginModal";

export function LoginModalContent() {
  const { requestClose } = useModalClose();
  const router = useRouter();

  return (
    <>
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold-bright">DKU Life</p>
      <h2 id="login-modal-title" className="font-display text-3xl">
        Welcome back.
      </h2>

      <div className="mt-8">
        <Suspense>
          <LoginForm
            mode="modal"
            onSuccess={() => {
              // Animate the modal out, then land back on the page the user was on
              // with a fresh (logged-in) server render.
              requestClose(() => router.refresh());
            }}
          />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-ink/50">
        New here?{" "}
        <Link href="/signup" className="text-gold hover:text-gold-bright">
          Create an account
        </Link>
      </p>
    </>
  );
}
