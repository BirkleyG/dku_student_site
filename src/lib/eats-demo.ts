// DKU Eats lives in its own app (birkleyg/eats) with no shared API yet, so
// these widgets show clearly-labeled demo data until that integration
// exists — deterministic per day/minute so it doesn't look static or flicker
// on every render, without needing a real backend.

export const DEMO_RESTAURANTS = [
  "Lanzhou Noodle House",
  "Bubble & Boba",
  "Dumpling Corner",
  "Campus Grill",
  "Kunshan Kebab",
  "Rice Bowl Express",
];

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000);
}

export function demoEatsOpenCount(): { open: number; total: number } {
  const total = DEMO_RESTAURANTS.length;
  const open = 2 + (dayIndex() % (total - 1));
  return { open, total };
}

export function demoEatsOrder(): { restaurant: string; status: string; etaMinutes: number } | null {
  const minute = new Date().getMinutes();
  if (minute % 2 === 1) return null;
  const restaurant = DEMO_RESTAURANTS[minute % DEMO_RESTAURANTS.length];
  const statuses = ["Order received", "Being prepared", "Ready for pickup"];
  const status = statuses[Math.floor(minute / 2) % statuses.length];
  const etaMinutes = 5 + (minute % 15);
  return { restaurant, status, etaMinutes };
}

export function demoEatsActivity(): { id: string; text: string; timeAgo: string }[] {
  const templates = [
    (r: string) => `Someone just ordered from ${r}`,
    (r: string) => `${r} marked an order ready for pickup`,
    (r: string) => `New order placed at ${r}`,
  ];
  const now = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const restaurant = DEMO_RESTAURANTS[(now.getMinutes() + i) % DEMO_RESTAURANTS.length];
    const template = templates[(now.getMinutes() + i) % templates.length];
    return { id: `demo-activity-${i}`, text: template(restaurant), timeAgo: `${(i + 1) * 3}m ago` };
  });
}
