// "Semester in Review": per-user stats for one semester, computed live from
// existing tables (no snapshot table). Read-only — nothing here writes.
//
// PLUGGING IN NEW CARDS: add an object to REVIEW_SECTIONS. Each section's
// `compute` gets the user + the semester's date range and returns a slide, or
// null when the user has no data for it (null slides are dropped, so
// "only show stats with data" is automatic). Points / achievements cards
// from the points system belong here, e.g.
//   { id: "points", label: "Points earned", compute: async (ctx) => ({...}) }
import { prisma } from "@/lib/prisma";
import { getSemesters, isSemesterEnded, type CalendarSemester } from "@/lib/academic-calendar";
import { campusDayKey } from "@/lib/datetime";

export type ReviewTone = "green" | "gold" | "blue" | "rose" | "violet" | "orange";

export type ReviewSlide = {
  id: string;
  title: string; // small heading, e.g. "You hosted"
  big: string; // the hero number / phrase
  caption: string; // one friendly sentence
  details?: { label: string; value: string }[];
  tone: ReviewTone;
};

export type ReviewRange = { from: Date; to: Date };

export type ReviewContext = {
  userId: string;
  semester: CalendarSemester;
  range: ReviewRange;
};

export type ReviewSection = {
  id: string;
  label: string;
  compute: (ctx: ReviewContext) => Promise<ReviewSlide | null>;
};

export type ReviewSemesterInfo = {
  key: string;
  label: string;
  start: string;
  end: string;
  /** false = only visible through the admin preview (semester not over yet). */
  ended: boolean;
};

export type SemesterReviewData = {
  semester: ReviewSemesterInfo;
  slides: ReviewSlide[];
};

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

// Campus (UTC+8) day boundaries; the range is clamped to "now" for previews.
function rangeFor(semester: CalendarSemester, now: Date): ReviewRange {
  const from = new Date(`${semester.start}T00:00:00+08:00`);
  const endExclusive = new Date(new Date(`${semester.end}T00:00:00+08:00`).getTime() + 24 * 3600 * 1000);
  return { from, to: endExclusive.getTime() > now.getTime() ? now : endExclusive };
}

const inRange = (r: ReviewRange) => ({ gte: r.from, lt: r.to });

type Detail = { label: string; value: string };

export const REVIEW_SECTIONS: ReviewSection[] = [
  {
    id: "events",
    label: "Events",
    compute: async ({ userId, range }) => {
      const [hosted, rsvps, guests] = await Promise.all([
        prisma.event.count({ where: { hostId: userId, kind: "EVENT", startsAt: inRange(range) } }),
        prisma.rsvp.count({ where: { userId, event: { startsAt: inRange(range) } } }),
        prisma.rsvp.count({ where: { event: { hostId: userId, startsAt: inRange(range) } } }),
      ]);
      if (!hosted && !rsvps) return null;
      const details: Detail[] = [];
      if (hosted) details.push({ label: "Events hosted", value: String(hosted) });
      if (rsvps) details.push({ label: "Events you RSVPed to", value: String(rsvps) });
      if (hosted && guests) details.push({ label: "RSVPs to your events", value: String(guests) });
      const showRsvps = rsvps >= hosted;
      return {
        id: "events",
        title: showRsvps ? "You RSVPed to" : "You hosted",
        big: plural(showRsvps ? rsvps : hosted, "event"),
        caption: hosted ? "Campus is livelier because you organized something." : "You made the most of what was happening on campus.",
        details,
        tone: "orange",
      };
    },
  },
  {
    id: "chat",
    label: "Chat",
    compute: async ({ userId, range }) => {
      const [top, replies, byChannel] = await Promise.all([
        prisma.chatMessage.count({ where: { authorId: userId, parentId: null, createdAt: inRange(range) } }),
        prisma.chatMessage.count({ where: { authorId: userId, parentId: { not: null }, createdAt: inRange(range) } }),
        prisma.chatMessage.groupBy({
          by: ["channelId"],
          where: { authorId: userId, createdAt: inRange(range), channel: { kind: { not: "DIRECT" } } },
          _count: { _all: true },
          orderBy: { _count: { channelId: "desc" } },
          take: 1,
        }),
      ]);
      const total = top + replies;
      if (!total) return null;
      const details: Detail[] = [
        { label: "Messages sent", value: String(top) },
        { label: "Thread replies", value: String(replies) },
      ];
      if (byChannel[0]) {
        const ch = await prisma.chatChannel.findUnique({ where: { id: byChannel[0].channelId }, select: { name: true } });
        if (ch) details.push({ label: "Favorite channel", value: ch.name });
      }
      return {
        id: "chat",
        title: "You sent",
        big: plural(total, "message"),
        caption: "Always something to say. Conversations need people like you.",
        details,
        tone: "blue",
      };
    },
  },
  {
    id: "wisdom",
    label: "Wisdom",
    compute: async ({ userId, range }) => {
      const [topics, recs, votes] = await Promise.all([
        prisma.wisdomTopic.count({ where: { createdById: userId, createdAt: inRange(range) } }),
        prisma.wisdomRecommendation.count({ where: { authorId: userId, createdAt: inRange(range) } }),
        // Votes have no timestamp, so count upvotes on recommendations posted this semester.
        prisma.wisdomVote.count({
          where: { value: { gt: 0 }, recommendation: { authorId: userId, createdAt: inRange(range) } },
        }),
      ]);
      if (!topics && !recs) return null;
      const details: Detail[] = [];
      if (topics) details.push({ label: "Topics started", value: String(topics) });
      if (recs) details.push({ label: "Recommendations shared", value: String(recs) });
      if (votes) details.push({ label: "Upvotes earned", value: String(votes) });
      return {
        id: "wisdom",
        title: "You shared your wisdom",
        big: plural(topics + recs, "time"),
        caption: "Your local knowledge helped other students find their way.",
        details,
        tone: "gold",
      };
    },
  },
  {
    id: "dear-dku",
    label: "Dear DKU",
    compute: async ({ userId, range }) => {
      const [posts, comments] = await Promise.all([
        prisma.dearDkuPost.count({ where: { authorId: userId, createdAt: inRange(range) } }),
        prisma.dearDkuComment.count({ where: { authorId: userId, createdAt: inRange(range) } }),
      ]);
      if (!posts && !comments) return null;
      const details: Detail[] = [];
      if (posts) details.push({ label: "Posts published", value: String(posts) });
      if (comments) details.push({ label: "Comments left", value: String(comments) });
      return {
        id: "dear-dku",
        title: "In Dear DKU you wrote",
        big: plural(posts + comments, "piece"),
        caption: "Thoughtful words, and thoughtful replies to others'.",
        details,
        tone: "violet",
      };
    },
  },
  {
    id: "courses",
    label: "Courses & professors",
    compute: async ({ userId, range }) => {
      const [courses, comments, resources, profs, reviews] = await Promise.all([
        prisma.course.count({ where: { createdById: userId, createdAt: inRange(range) } }),
        prisma.courseComment.count({ where: { authorId: userId, createdAt: inRange(range) } }),
        prisma.courseResource.count({ where: { authorId: userId, createdAt: inRange(range) } }),
        prisma.professor.count({ where: { addedById: userId, createdAt: inRange(range) } }),
        prisma.professorReview.count({ where: { authorId: userId, createdAt: inRange(range) } }),
      ]);
      const total = courses + comments + resources + profs + reviews;
      if (!total) return null;
      const details: Detail[] = [];
      if (courses) details.push({ label: "Courses added", value: String(courses) });
      if (reviews) details.push({ label: "Professors rated", value: String(reviews) });
      if (profs) details.push({ label: "Professors added", value: String(profs) });
      if (resources) details.push({ label: "Resources uploaded", value: String(resources) });
      if (comments) details.push({ label: "Course comments", value: String(comments) });
      return {
        id: "courses",
        title: "You helped your classmates with",
        big: plural(total, "contribution"),
        caption: "Reviews, courses and study resources make registration easier for everyone.",
        details,
        tone: "green",
      };
    },
  },
  {
    id: "slb",
    label: "Student Leaders Board",
    compute: async ({ userId, range }) => {
      const [pollVotes, sponsored, backed] = await Promise.all([
        prisma.slbPollVote.count({ where: { userId, createdAt: inRange(range) } }),
        prisma.slbInitiative.count({ where: { sponsorId: userId, createdAt: inRange(range) } }),
        prisma.slbInitiativeBacker.count({ where: { userId, createdAt: inRange(range) } }),
      ]);
      if (!pollVotes && !sponsored && !backed) return null;
      const details: Detail[] = [];
      if (pollVotes) details.push({ label: "Polls voted in", value: String(pollVotes) });
      if (sponsored) details.push({ label: "Initiatives sponsored", value: String(sponsored) });
      if (backed) details.push({ label: "Initiatives backed", value: String(backed) });
      return {
        id: "slb",
        title: "You had a say in campus life",
        big: plural(pollVotes + sponsored + backed, "action"),
        caption: "Student government works best when students take part.",
        details,
        tone: "rose",
      };
    },
  },
  {
    id: "score",
    label: "Community score",
    compute: async ({ userId, range }) => {
      const agg = await prisma.scoreEvent.aggregate({
        where: { userId, createdAt: inRange(range) },
        _sum: { points: true },
        _count: { _all: true },
      });
      const points = agg._sum.points ?? 0;
      if (!points) return null;
      return {
        id: "score",
        title: "You earned",
        big: `${points.toLocaleString("en-US")} pts`,
        caption: `Across ${plural(agg._count._all, "contribution")} to the community.`,
        tone: "gold",
      };
    },
  },
  // Eats and Marketplace are embedded third-party apps with no local tables, so
  // there is nothing to count for them.
];

/** Semesters a user may open. Admin preview also includes semesters that have started but not ended. */
export function getReviewSemesters(now: Date = new Date(), preview = false): ReviewSemesterInfo[] {
  const today = campusDayKey(now);
  return getSemesters()
    .filter((s) => isSemesterEnded(s, now) || (preview && s.start <= today))
    .map((s) => ({ key: s.key, label: s.label, start: s.start, end: s.end, ended: isSemesterEnded(s, now) }))
    .sort((a, b) => b.end.localeCompare(a.end)); // newest first
}

export async function computeSemesterReview(
  userId: string,
  semesterKey: string,
  now: Date = new Date(),
  preview = false,
): Promise<SemesterReviewData | null> {
  const info = getReviewSemesters(now, preview).find((s) => s.key === semesterKey);
  const semester = getSemesters().find((s) => s.key === semesterKey);
  if (!info || !semester) return null;
  const ctx: ReviewContext = { userId, semester, range: rangeFor(semester, now) };
  const results = await Promise.all(REVIEW_SECTIONS.map((s) => s.compute(ctx).catch(() => null)));
  return { semester: info, slides: results.filter((s): s is ReviewSlide => s !== null) };
}
