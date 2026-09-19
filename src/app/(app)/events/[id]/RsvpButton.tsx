"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function RsvpButton({
  eventId,
  initialGoing,
  initialCount,
  loggedIn,
}: {
  eventId: string;
  initialGoing: boolean;
  initialCount: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  if (!loggedIn) {
    return (
      <Button variant="secondary" onClick={() => router.push("/login")}>
        Log in to RSVP
      </Button>
    );
  }

  const onClick = async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setGoing(data.going);
      setCount((c) => c + (data.going ? 1 : -1));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant={going ? "secondary" : "primary"} onClick={onClick} disabled={loading}>
        {going ? "You're going ✓" : "RSVP"}
      </Button>
      <span className="text-sm text-paper/50">{count} going</span>
    </div>
  );
}
