// Fallback for the @modal slot on hard navigations / refreshes: render nothing so
// the modal never appears unless a client-side navigation intercepted /login.
export default function Default() {
  return null;
}
