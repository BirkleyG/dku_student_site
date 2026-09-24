import { LoginModal } from "@/components/layout/LoginModal";
import { LoginModalContent } from "./LoginModalContent";

// Intercepts client-side navigation to /login and renders it as a modal over the
// current page instead. A direct visit or refresh of /login still renders the full
// page at src/app/login/page.tsx (see @modal/default.tsx for the unmatched-slot case).
export default function InterceptedLoginPage() {
  return (
    <LoginModal>
      <LoginModalContent />
    </LoginModal>
  );
}
