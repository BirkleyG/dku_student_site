import { redirect } from "next/navigation";

// The site opens straight onto the dashboard; logged-out visitors get the
// onboarding tour as a pop-up there (see OnboardingProvider).
export default function LandingPage() {
  redirect("/home");
}
