// Client-safe view models for the newer Home widgets. The server (src/lib/widget-data.ts) turns database rows
// into these already-formatted, already-translated shapes; src/components/widgets/ExtWidgets.tsx draws them.
// Anything that depends on a widget's own config (which category, which channel, which time zone...) ships the
// full lookup here and the client picks the right entry, so adding or reconfiguring a widget never needs a reload.

export type WvItem = { id: string; primary: string; secondary?: string; href?: string };

export type WvShuffleItem = { id: string; kicker?: string; title: string; body?: string; href?: string };

export type WV =
  | { t: "empty"; label: string }
  | { t: "stat"; value: string; label: string; sub?: string }
  | { t: "list"; items: WvItem[]; empty: string }
  | { t: "spot"; kicker?: string; title: string; body?: string; foot?: string }
  | { t: "progress"; pct: number; value: string; label: string; sub?: string }
  | { t: "launch"; text: string; cta: string }
  | { t: "ticker"; items: WvItem[]; empty: string }
  | { t: "shuffle"; items: WvShuffleItem[]; empty: string; cta: string }
  | {
      t: "poll";
      pollId: string;
      question: string;
      options: { id: string; label: string; votes: number }[];
      myVote: string | null;
      loggedIn: boolean;
    }
  | { t: "initiative"; id: string; title: string; backers: number; backed: boolean; canBack: boolean; status: string }
  | { t: "chatComposer" }
  | { t: "dmLaunch" }
  | { t: "tipComposer"; topics: { id: string; title: string; requireLocation: boolean }[] }
  | {
      t: "wisdomCategories";
      /** Tips shared this week, keyed by WisdomCategory. */
      tally: Record<string, number>;
      /** Newest tip per category. */
      newest: Record<string, { place: string; topic: string; body: string } | null>;
    }
  | { t: "pinnedChat"; byChannel: Record<string, { channelName: string; author: string; body: string } | null> }
  | { t: "currency"; rates: Record<string, number> | null }
  | { t: "contacts"; items: { id: string; label: string; number: string }[] };

export type WidgetExt = Partial<Record<string, WV>>;
