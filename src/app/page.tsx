import { redirect } from "next/navigation";

// The site opens straight onto the dashboard; logged-out visitors get the
// welcome chat as a pop-up there (see WelcomeModal on /home).
export default function LandingPage() {
  redirect("/home");
}
