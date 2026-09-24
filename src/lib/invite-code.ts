import { randomInt } from "crypto";

// Excludes visually confusable characters (0/O, 1/I/L) since these get
// copy-pasted or read aloud to someone setting up their account.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
