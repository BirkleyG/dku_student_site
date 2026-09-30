// Numbers shown on the "Important contacts" Home widget.
//
// NATIONAL_EMERGENCY are the nationwide emergency lines in mainland China.
// CAMPUS_CONTACTS is deliberately empty: DKU's own security desk, health center and IT help numbers have to be
// filled in from an official source (this codebase doesn't have them, and a wrong number on an "emergency
// contacts" tile is worse than none). Add entries as { id, label, number } and they show up under the emergency
// numbers automatically — no other change needed.

export type ContactEntry = { id: string; label: string; labelZh: string; number: string };

export const NATIONAL_EMERGENCY: ContactEntry[] = [
  { id: "police", label: "Police", labelZh: "报警", number: "110" },
  { id: "ambulance", label: "Ambulance", labelZh: "急救", number: "120" },
  { id: "fire", label: "Fire", labelZh: "火警", number: "119" },
];

export const CAMPUS_CONTACTS: ContactEntry[] = [];
