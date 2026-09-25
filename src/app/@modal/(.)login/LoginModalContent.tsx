"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { useModalClose } from "@/components/layout/LoginModal";
import { useT } from "@/lib/i18n/client";

export function LoginModalContent() {
  const t = useT("auth");
  const { requestClose } = useModalClose();
  const router = useRouter();

  return (
    <>
      <h2 id="login-modal-title" className="font-display text-3xl">
        {t("welcomeBack")}
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
        {t("newHere")}{" "}
        <Link href="/signup" className="text-gold hover:text-gold-bright">
          {t("createAccount")}
        </Link>
      </p>
    </>
  );
}
