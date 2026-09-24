"use client";

import { useState, useSyncExternalStore } from "react";
import { Welcome } from "@/app/Welcome";
import { LoginModal, useModalClose } from "./LoginModal";

const DISMISSED_KEY = "dku-life:welcome-dismissed";

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Private mode / blocked storage: the chat just shows again next visit.
  }
}

/**
 * The onboarding chat, shown as a dismissible pop-up over the site for
 * logged-out visitors instead of a full page they're locked into. Once closed
 * (or finished) it stays closed on this device.
 */
export function WelcomeModal() {
  const dismissedBefore = useSyncExternalStore(
    () => () => {},
    readDismissed,
    () => true,
  );
  const [closed, setClosed] = useState(false);

  if (dismissedBefore || closed) return null;

  return (
    <LoginModal
      labelledBy="welcome-modal-title"
      className="sm:max-w-xl"
      onDismiss={() => {
        rememberDismissed();
        setClosed(true);
      }}
    >
      <h2 id="welcome-modal-title" className="sr-only">
        Welcome to DKU Life
      </h2>
      <WelcomeInModal />
    </LoginModal>
  );
}

function WelcomeInModal() {
  const { requestClose } = useModalClose();
  return <Welcome variant="modal" onFinish={() => requestClose()} />;
}
