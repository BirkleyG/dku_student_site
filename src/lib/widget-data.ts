import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { makeT, type TFunction } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/locale";
import { addCampusDays, campusDayKey, campusStartOfDay, formatCampus, isSameCampusWeek } from "@/lib/datetime";
import { ACADEMIC_CALENDAR, getCurrentSessionStatus } from "@/lib/academic-calendar";
import { getLilypadPosts } from "@/lib/lilypad";
import { computeDegreeProgress } from "@/lib/planner-progress";
import { getAchievementCompletion, getLeaderboard } from "@/lib/leaderboard";
import { getAchievementProgress, getRecentPointEvents, getUserPointsSummary } from "@/lib/points";
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, isAchievementKey } from "@/lib/achievements";
import { ACTIVITY_RULES, POINT_SOURCES, isActivityKey } from "@/lib/points-rules";
import { getReviewSemesters } from "@/lib/semester-review";
import { dmChannelName } from "@/lib/chat";
import { getMentionCounts, getUnreadCounts } from "@/lib/chat-state";
import { getFriendActivity, getOnlineFriends, getUpcomingBirthdays } from "@/lib/friends";
import { CAMPUS_CONTACTS, NATIONAL_EMERGENCY } from "@/lib/campus-contacts";
import {
  WEATHER_EMOJI,
  fetchCnyRates,
  fetchKunshanAirQuality,
  fetchKunshanWeather,
} from "@/lib/widget-external";
import type { WV, WidgetExt, WvItem, WvShuffleItem } from "@/lib/widget-types";

export type WidgetUser = { id: string; role: "STUDENT" | "ADMIN"; communityScore: number; showOnLeaderboard: boolean; createdAt: Date };

type Ctx = { user: WidgetUser | null; now: Date; t: TFunction; locale: Locale };

const DAY_MS = 24 * 60 * 60 * 1000;

const empty = (label: string): WV => ({ t: "empty", label });
const clip = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
};
const words = (enumValue: string) =>
  enumValue
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
const ago = (d: Date) => formatDistanceToNow(d, { addSuffix: true });
const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

/** "2d 4h", "3h 10m", "25m". */
function countdown(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d >= 1) return `${d}d ${h}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Whole campus days from today until an ISO date (YYYY-MM-DD), negative if past. */
function daysUntilDate(isoDate: string, now: Date): number {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${campusDayKey(now)}T00:00:00Z`)) / DAY_MS);
}

function normalizeCode(code: string) {
  return code.replace(/\s+/g, "").toUpperCase();
}

/** Deterministic string hash, so "of the day" picks are stable for everyone. */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function sample<T>(items: T[], n: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Counts this user's dashboard visit for today (idempotent per campus day) and returns their current streak of
 * consecutive campus days. Never throws.
 */
export async function recordVisitAndGetStreak(userId: string, now: Date): Promise<{ streak: number; totalDays: number } | null> {
  try {
    const day = campusDayKey(now);
    await prisma.dailyVisit.upsert({ where: { userId_day: { userId, day } }, create: { userId, day }, update: {} });
    const rows = await prisma.dailyVisit.findMany({ where: { userId }, orderBy: { day: "desc" }, take: 400, select: { day: true } });
    const seen = new Set(rows.map((r) => r.day));
    let streak = 0;
    for (let cursor = new Date(`${day}T00:00:00Z`).getTime(); seen.has(new Date(cursor).toISOString().slice(0, 10)); cursor -= DAY_MS) streak++;
    const totalDays = await prisma.dailyVisit.count({ where: { userId } });
    return { streak, totalDays };
  } catch (err) {
    console.error("Failed to record dashboard visit:", err);
    return null;
  }
}

type Loader = (ctx: Ctx) => Promise<Record<string, WV | undefined>>;

// ---------------------------------------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------------------------------------

const loadEvents: Loader = async ({ user, now, t }) => {
  const out: Record<string, WV> = {};
  const login = empty(t("logInToSee"));

  const [rsvps, trending, hosting, nowEvents, deadlines] = await Promise.all([
    user
      ? prisma.rsvp.findMany({
          where: { userId: user.id, event: { endsAt: { gte: now }, approved: true } },
          include: { event: true },
          orderBy: { event: { startsAt: "asc" } },
          take: 30,
        })
      : Promise.resolve([]),
    prisma.event.findMany({
      where: { approved: true, kind: "EVENT", startsAt: { gte: now, lte: new Date(now.getTime() + 14 * DAY_MS) } },
      include: { _count: { select: { rsvps: true } } },
      orderBy: { startsAt: "asc" },
      take: 60,
    }),
    user
      ? prisma.event.findMany({
          where: { hostId: user.id, endsAt: { gte: now } },
          include: { _count: { select: { rsvps: true } } },
          orderBy: { startsAt: "asc" },
          take: 4,
        })
      : Promise.resolve([]),
    prisma.event.findMany({
      where: { approved: true, kind: "EVENT", allDay: false, startsAt: { lte: new Date(now.getTime() + 60 * 60000) }, endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    prisma.event.findMany({
      where: { kind: "DEADLINE", approved: true, startsAt: { gte: campusStartOfDay(now) } },
      orderBy: { startsAt: "asc" },
      take: 30,
    }),
  ]);

  // Next RSVP'd event
  if (!user) out.EVENTS_NEXT_RSVP = login;
  else if (!rsvps.length) out.EVENTS_NEXT_RSVP = empty(t("noRsvps"));
  else {
    const e = rsvps[0].event;
    out.EVENTS_NEXT_RSVP = {
      t: "stat",
      value: e.startsAt <= now ? t("now") : countdown(e.startsAt.getTime() - now.getTime()),
      label: e.title,
      sub: formatCampus(e.startsAt, "EEE MMM d · h:mm a"),
    };
  }

  // This week's RSVP'd events
  if (!user) out.EVENTS_MY_WEEK = login;
  else {
    const week = rsvps.filter((r) => isSameCampusWeek(r.event.startsAt, now) || r.event.startsAt <= now).slice(0, 5);
    out.EVENTS_MY_WEEK = {
      t: "list",
      empty: t("nothingRsvpdThisWeek"),
      items: week.map((r) => ({
        id: r.id,
        primary: r.event.title,
        secondary: `${r.event.allDay ? formatCampus(r.event.startsAt, "EEE") : formatCampus(r.event.startsAt, "EEE h:mm a")} · ${r.event.location}`,
      })),
    };
  }

  // Trending (most RSVPs)
  const hot = trending.filter((e) => e._count.rsvps > 0).sort((a, b) => b._count.rsvps - a._count.rsvps).slice(0, 4);
  out.EVENTS_TRENDING = {
    t: "list",
    empty: t("noTrendingEvents"),
    items: hot.map((e) => ({
      id: e.id,
      primary: e.title,
      secondary: t(e._count.rsvps === 1 ? "goingOne" : "goingMany", { n: e._count.rsvps }) + ` · ${formatCampus(e.startsAt, "EEE MMM d")}`,
    })),
  };

  // Events I host
  out.EVENTS_HOSTING = user
    ? {
        t: "list",
        empty: t("notHosting"),
        items: hosting.map((e) => ({
          id: e.id,
          primary: e.title,
          secondary: t(e._count.rsvps === 1 ? "goingOne" : "goingMany", { n: e._count.rsvps }) + ` · ${formatCampus(e.startsAt, "EEE MMM d")}`,
        })),
      }
    : login;

  // Happening now / within the hour
  out.EVENTS_HAPPENING_NOW = {
    t: "list",
    empty: t("nothingHappeningNow"),
    items: nowEvents.map((e) => ({
      id: e.id,
      primary: e.title,
      secondary: `${e.startsAt <= now ? t("now") : t("inMinutes", { n: Math.max(1, Math.round((e.startsAt.getTime() - now.getTime()) / 60000)) })} · ${e.location}`,
    })),
  };

  // Registration / add-drop deadline
  const registration = deadlines.find((d) => /regist|add\s*\/?\s*drop|\bdrop\b|withdraw/i.test(d.title));
  const deadline = registration ?? deadlines[0];
  if (!deadline) out.EVENTS_DEADLINE = empty(t("noDeadlines"));
  else {
    const days = daysUntilDate(campusDayKey(deadline.startsAt), now);
    out.EVENTS_DEADLINE = {
      t: "stat",
      value: days <= 0 ? t("today") : `${days}d`,
      label: deadline.title,
      sub: formatCampus(deadline.startsAt, "EEE MMM d"),
    };
  }
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// SLB
// ---------------------------------------------------------------------------------------------------------

const loadSlb: Loader = async ({ user, now, t }) => {
  const out: Record<string, WV> = {};
  const [announcement, poll, initiative, membership] = await Promise.all([
    prisma.slbAnnouncement.findFirst({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true, slbMembership: { select: { title: true } } } } },
    }),
    prisma.slbPoll.findFirst({
      where: { OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
      include: {
        options: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } },
        votes: user ? { where: { userId: user.id }, select: { optionId: true } } : false,
      },
    }),
    prisma.slbInitiative.findFirst({
      where: { status: { in: ["PROPOSED", "IN_PROGRESS"] } },
      orderBy: [{ backers: { _count: "desc" } }, { createdAt: "desc" }],
      include: { _count: { select: { backers: true } }, backers: user ? { where: { userId: user.id }, select: { id: true } } : false },
    }),
    user ? prisma.slbMember.findUnique({ where: { userId: user.id }, select: { id: true } }) : Promise.resolve(null),
  ]);

  out.SLB_LATEST = announcement
    ? {
        t: "spot",
        kicker: `${fullName(announcement.author)}${announcement.author.slbMembership ? `, ${announcement.author.slbMembership.title}` : ""}`,
        title: announcement.title,
        body: clip(announcement.body, 140),
        foot: ago(announcement.createdAt),
      }
    : empty(t("noAnnouncements"));

  out.SLB_POLL = poll
    ? {
        t: "poll",
        pollId: poll.id,
        question: poll.question,
        options: poll.options.map((o) => ({ id: o.id, label: o.label, votes: o._count.votes })),
        myVote: poll.votes?.[0]?.optionId ?? null,
        loggedIn: Boolean(user),
      }
    : empty(t("noOpenPoll"));

  out.SLB_TRENDING = initiative
    ? {
        t: "initiative",
        id: initiative.id,
        title: initiative.title,
        backers: initiative._count.backers,
        backed: Boolean(initiative.backers?.length),
        canBack: Boolean(membership) && initiative.sponsorId !== user?.id,
        status: initiative.status,
      }
    : empty(t("noInitiatives"));
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// The Lilypad
// ---------------------------------------------------------------------------------------------------------

const loadLilypad: Loader = async ({ t }) => {
  const { posts } = await getLilypadPosts({ page: 1, perPage: 6 });
  const first = posts[0];
  return {
    LILYPAD_HEADLINE: first
      ? { t: "spot", kicker: first.category ?? undefined, title: first.title, foot: formatCampus(first.date, "MMM d") }
      : empty(t("noArticlesYet")),
    LILYPAD_TICKER: {
      t: "ticker",
      empty: t("noArticlesYet"),
      items: posts.map((p): WvItem => ({ id: String(p.id), primary: p.title, secondary: `${p.category ?? "Lilypad"} · ${formatCampus(p.date, "MMM d")}` })),
    },
  };
};

// ---------------------------------------------------------------------------------------------------------
// Wisdom
// ---------------------------------------------------------------------------------------------------------

const loadWisdom: Loader = async ({ user, now, t }) => {
  const out: Record<string, WV> = {};
  const [recs, upvotes, topics] = await Promise.all([
    prisma.wisdomRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { topic: { select: { id: true, title: true, category: true } }, votes: { select: { value: true } } },
    }),
    user ? prisma.wisdomVote.count({ where: { value: { gt: 0 }, recommendation: { authorId: user.id } } }) : Promise.resolve(0),
    prisma.wisdomTopic.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, requireLocation: true } }),
  ]);
  const scored = recs.map((r) => ({ rec: r, score: r.votes.reduce((sum, v) => sum + v.value, 0) }));
  const body = (r: (typeof recs)[number]) => clip(r.description, 120);

  const top = [...scored].sort((a, b) => b.score - a.score || b.rec.createdAt.getTime() - a.rec.createdAt.getTime())[0];
  out.WISDOM_TOP =
    top && top.score > 0
      ? { t: "spot", kicker: top.rec.topic.title, title: top.rec.placeName, body: body(top.rec), foot: t("votesN", { n: top.score }) }
      : empty(t("noTipsYet"));

  const byId = [...recs].sort((a, b) => a.id.localeCompare(b.id));
  const daily = byId.length ? byId[hash(campusDayKey(now)) % byId.length] : null;
  out.WISDOM_DAILY = daily
    ? { t: "spot", kicker: daily.topic.title, title: daily.placeName, body: body(daily), foot: daily.location ?? undefined }
    : empty(t("noTipsYet"));

  out.WISDOM_SURPRISE = {
    t: "shuffle",
    empty: t("noTipsYet"),
    cta: t("shuffle"),
    items: sample(recs, 40).map(
      (r): WvShuffleItem => ({ id: r.id, kicker: r.topic.title, title: r.placeName, body: body(r), href: `/wisdom/${r.topic.id}` }),
    ),
  };

  const weekAgo = now.getTime() - 7 * DAY_MS;
  const tally: Record<string, number> = {};
  const newest: Record<string, { place: string; topic: string; body: string } | null> = {};
  for (const r of recs) {
    const cat = r.topic.category;
    if (r.createdAt.getTime() >= weekAgo) tally[cat] = (tally[cat] ?? 0) + 1;
    if (!newest[cat]) newest[cat] = { place: r.placeName, topic: r.topic.title, body: body(r) };
  }
  const categories: WV = { t: "wisdomCategories", tally, newest };
  out.WISDOM_TALLY = categories;
  out.WISDOM_NEWEST = categories;

  out.WISDOM_UPVOTES = user ? { t: "stat", value: String(upvotes), label: t(upvotes === 1 ? "upvoteOnTips" : "upvotesOnTips") } : empty(t("logInToSee"));
  out.WISDOM_SHARE = { t: "tipComposer", topics };
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------------------------------------

const loadClubs: Loader = async ({ user, now, t }) => {
  const out: Record<string, WV> = {};
  const [clubs, mine] = await Promise.all([
    prisma.club.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { members: true } } } }),
    user ? prisma.clubMembership.findMany({ where: { userId: user.id }, include: { club: true }, orderBy: { joinedAt: "desc" }, take: 6 }) : Promise.resolve([]),
  ]);

  if (clubs.length) {
    const ordered = [...clubs].sort((a, b) => a.id.localeCompare(b.id));
    const week = Math.floor(Date.parse(`${campusDayKey(now)}T00:00:00Z`) / (7 * DAY_MS));
    const c = ordered[week % ordered.length];
    out.CLUBS_SPOTLIGHT = {
      t: "spot",
      kicker: words(c.category),
      title: c.name,
      body: clip(c.description, 110),
      foot: t(c._count.members === 1 ? "memberOne" : "memberMany", { n: c._count.members }),
    };
  } else out.CLUBS_SPOTLIGHT = empty(t("noClubs"));

  out.CLUBS_NEWEST = {
    t: "list",
    empty: t("noClubs"),
    items: clubs.slice(0, 4).map((c) => ({ id: c.id, primary: c.name, secondary: `${words(c.category)} · ${ago(c.createdAt)}` })),
  };

  out.CLUBS_MINE = user
    ? {
        t: "list",
        empty: t("noClubsJoined"),
        items: mine.map((m) => ({ id: m.id, primary: m.club.name, secondary: words(m.club.category), href: `/clubs/${m.clubId}` })),
      }
    : empty(t("logInToSee"));
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// Dear DKU
// ---------------------------------------------------------------------------------------------------------

const loadDearDku: Loader = async ({ now, t }) => {
  const [posts, commented] = await Promise.all([
    prisma.dearDkuPost.findMany({ orderBy: { createdAt: "desc" }, take: 40, select: { id: true, title: true, summary: true, category: true, createdAt: true } }),
    prisma.dearDkuComment.groupBy({
      by: ["postId"],
      where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
      _count: { _all: true },
      orderBy: { _count: { postId: "desc" } },
      take: 3,
    }),
  ]);
  const commentedPosts = await prisma.dearDkuPost.findMany({ where: { id: { in: commented.map((c) => c.postId) } }, select: { id: true, title: true } });
  const titleById = new Map(commentedPosts.map((p) => [p.id, p.title]));
  const first = posts[0];
  return {
    DEAR_LATEST: first
      ? { t: "spot", kicker: words(first.category), title: first.title, body: clip(first.summary, 110), foot: ago(first.createdAt) }
      : empty(t("noPostsYet")),
    DEAR_COMMENTED: {
      t: "list",
      empty: t("noDiscussionThisWeek"),
      items: commented.flatMap((c) =>
        titleById.has(c.postId)
          ? [{ id: c.postId, primary: titleById.get(c.postId)!, secondary: t(c._count._all === 1 ? "commentOne" : "commentMany", { n: c._count._all }) }]
          : [],
      ),
    },
    DEAR_RANDOM: {
      t: "shuffle",
      empty: t("noPostsYet"),
      cta: t("shuffle"),
      items: sample(posts, 30).map((p): WvShuffleItem => ({ id: p.id, kicker: words(p.category), title: p.title, body: clip(p.summary, 110), href: `/dear-dku/${p.id}` })),
    },
  };
};

// ---------------------------------------------------------------------------------------------------------
// Courses, professors, planner
// ---------------------------------------------------------------------------------------------------------

const RESOURCE_TYPE_LABELS: Record<string, string> = { SYLLABUS: "Syllabus", NOTES: "Notes", EXAM: "Exam", MATERIALS: "Materials", TIP: "Tip" };

const loadAcademics: Loader = async ({ user, now, t }) => {
  const out: Record<string, WV> = {};
  const login = empty(t("logInToSee"));

  const plan = user
    ? await prisma.academicPlan.findFirst({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], include: { courses: true } })
    : null;
  const plannedCodes = new Set((plan?.courses ?? []).map((c) => normalizeCode(c.code)));

  const [comments, resources, ratingGroups, reviews, offerings, myReviews] = await Promise.all([
    prisma.courseComment.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { course: { select: { code: true } }, author: { select: { firstName: true } } } }),
    plannedCodes.size
      ? prisma.courseResource.findMany({ orderBy: { createdAt: "desc" }, take: 80, include: { course: { select: { code: true, title: true } } } })
      : Promise.resolve([]),
    prisma.professorReview.groupBy({
      by: ["professorId"],
      _avg: { teachingRating: true, funRating: true },
      _count: { _all: true },
    }),
    prisma.professorReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { professor: { select: { firstName: true, lastName: true } }, course: { select: { code: true } } },
    }),
    plannedCodes.size
      ? prisma.courseOffering.findMany({ orderBy: { semester: "desc" }, take: 300, include: { professor: true, course: { select: { code: true } } } })
      : Promise.resolve([]),
    user ? prisma.professorReview.findMany({ where: { authorId: user.id }, select: { professorId: true } }) : Promise.resolve([]),
  ]);

  out.COURSES_COMMENTS = {
    t: "list",
    empty: t("noCourseComments"),
    items: comments.map((c) => ({ id: c.id, primary: c.course.code, secondary: `${c.author.firstName}: ${clip(c.body, 60)}` })),
  };
  out.COURSES_SEARCH = { t: "launch", text: t("searchCourses"), cta: t("search") };

  if (!user) out.COURSES_RESOURCES = login;
  else if (!plannedCodes.size) out.COURSES_RESOURCES = empty(t("addCoursesToPlanner"));
  else {
    out.COURSES_RESOURCES = {
      t: "list",
      empty: t("noNewResources"),
      items: resources
        .filter((r) => plannedCodes.has(normalizeCode(r.course.code)))
        .slice(0, 4)
        .map((r) => ({ id: r.id, primary: `${r.course.code} · ${r.title}`, secondary: `${RESOURCE_TYPE_LABELS[r.type] ?? r.type} · ${ago(r.createdAt)}` })),
    };
  }

  // Professors: "rating" is teaching quality + fun (grading rating is difficulty, not a quality score).
  const rated = ratingGroups
    .map((g) => ({
      id: g.professorId,
      count: g._count._all,
      score: ((g._avg.teachingRating ?? 0) + (g._avg.funRating ?? 0)) / 2,
    }))
    .filter((g) => g.count > 0);
  const pool = rated.filter((g) => g.count >= 2).length ? rated.filter((g) => g.count >= 2) : rated;
  const best = [...pool].sort((a, b) => b.score - a.score || b.count - a.count)[0];
  if (best) {
    const prof = await prisma.professor.findUnique({ where: { id: best.id }, select: { firstName: true, lastName: true, department: true } });
    out.PROFESSORS_SPOTLIGHT = prof
      ? {
          t: "spot",
          kicker: prof.department,
          title: fullName(prof),
          foot: `${best.score.toFixed(1)} / 5 · ${t(best.count === 1 ? "reviewOne" : "reviewMany", { n: best.count })}`,
        }
      : empty(t("noReviewsYet"));
  } else out.PROFESSORS_SPOTLIGHT = empty(t("noReviewsYet"));

  out.PROFESSORS_REVIEWS = {
    t: "list",
    empty: t("noReviewsYet"),
    items: reviews.map((r) => ({
      id: r.id,
      primary: fullName(r.professor),
      secondary: `${((r.teachingRating + r.funRating) / 2).toFixed(1)}★${r.course ? ` · ${r.course.code}` : ""} · ${ago(r.createdAt)}`,
    })),
  };

  if (!user) out.PROFESSORS_TO_RATE = login;
  else if (!plannedCodes.size) out.PROFESSORS_TO_RATE = empty(t("addCoursesToPlanner"));
  else {
    const reviewed = new Set(myReviews.map((r) => r.professorId));
    const seen = new Set<string>();
    const items: WvItem[] = [];
    for (const o of offerings) {
      if (!plannedCodes.has(normalizeCode(o.course.code)) || reviewed.has(o.professorId) || seen.has(o.professorId)) continue;
      seen.add(o.professorId);
      items.push({ id: o.professorId, primary: fullName(o.professor), secondary: o.course.code, href: `/professors/${o.professorId}` });
      if (items.length === 4) break;
    }
    out.PROFESSORS_TO_RATE = { t: "list", items, empty: t("allProfessorsRated") };
  }

  // Planner
  if (!user) {
    out.PLANNER_CREDITS = login;
    out.PLANNER_SEMESTERS = login;
  } else if (!plan) {
    out.PLANNER_CREDITS = empty(t("noPlanYet"));
    out.PLANNER_SEMESTERS = empty(t("noPlanYet"));
  } else {
    const progress = computeDegreeProgress(plan.courses);
    out.PLANNER_CREDITS = {
      t: "progress",
      pct: progress.percent,
      value: `${progress.totalCredits}`,
      label: t("creditsOf", { n: progress.creditsNeeded }),
      sub: `${progress.percent}%`,
    };
    const slots: { year: number; semester: "FALL" | "SPRING"; label: string }[] = [];
    for (let year = 1; year <= 4; year++) {
      slots.push({ year, semester: "FALL", label: t("yearSemester", { year, semester: t("fall") }) });
      slots.push({ year, semester: "SPRING", label: t("yearSemester", { year, semester: t("spring") }) });
    }
    const filled = slots.filter((s) => plan.courses.some((c) => c.year === s.year && c.semester === s.semester));
    const nextEmpty = slots.find((s) => !filled.includes(s));
    out.PLANNER_SEMESTERS = {
      t: "progress",
      pct: Math.round((filled.length / slots.length) * 100),
      value: `${filled.length}/${slots.length}`,
      label: t("semestersPlanned"),
      sub: nextEmpty ? t("nextEmpty", { label: nextEmpty.label }) : t("allSemestersPlanned"),
    };
  }
  void now;
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------------------------------------

const loadChat: Loader = async ({ user, t }) => {
  const out: Record<string, WV> = {};
  out.CHAT_COMPOSER = { t: "chatComposer" };
  out.CHAT_DM = { t: "dmLaunch" };
  if (!user) {
    out.CHAT_PINNED = empty(t("logInToSee"));
    out.CHAT_INVITES = empty(t("logInToSee"));
    return out;
  }

  const [channels, invites] = await Promise.all([
    prisma.chatChannel.findMany({
      where: { OR: [{ id: "general" }, { members: { some: { userId: user.id } } }] },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 12,
    }),
    prisma.chatGroupInvite.findMany({
      where: { inviteeId: user.id, status: "PENDING" },
      include: { channel: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const byChannel: Record<string, { channelName: string; author: string; body: string } | null> = {};
  await Promise.all(
    channels.map(async (c) => {
      const latest = await prisma.chatMessage.findFirst({
        where: { channelId: c.id, parentId: null },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true } } },
      });
      byChannel[c.id] = latest
        ? { channelName: c.kind === "DIRECT" ? dmChannelName(c, user.id) : c.name, author: latest.author.firstName, body: clip(latest.body, 90) }
        : null;
    }),
  );
  out.CHAT_PINNED = { t: "pinnedChat", byChannel };
  out.CHAT_INVITES = {
    t: "stat",
    value: String(invites.length),
    label: t(invites.length === 1 ? "groupInviteOne" : "groupInviteMany"),
    sub: invites.length ? clip(invites.slice(0, 2).map((i) => i.channel.name).join(", "), 40) : t("noInvitesWaiting"),
  };
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------------------------------------

const loadProfile: Loader = async ({ user, now, t, locale }) => {
  const out: Record<string, WV> = {};
  if (!user) {
    for (const k of [
      "PROFILE_POINTS", "PROFILE_ACHIEVEMENTS", "PROFILE_LEADERBOARD", "PROFILE_NEXT_ACHIEVEMENT",
      "PROFILE_RECENT_POINTS", "PROFILE_SHOWCASE", "PROFILE_RECAP",
    ]) out[k] = empty(t("logInToSee"));
    return out;
  }
  const zh = locale === "zh";

  const semesters = getReviewSemesters(now).filter((s) => s.ended);
  const lastSemester = semesters[0] ?? null;

  const [progress, recent, completion, top, higher, keyCounts, recap] = await Promise.all([
    getAchievementProgress(user.id),
    getRecentPointEvents(user.id, 5),
    getAchievementCompletion(),
    getLeaderboard(3),
    user.showOnLeaderboard && user.role !== "ADMIN" && user.communityScore > 0
      ? prisma.user.count({ where: { showOnLeaderboard: true, role: { not: "ADMIN" }, communityScore: { gt: user.communityScore } } })
      : Promise.resolve(null),
    prisma.pointEvent.groupBy({ by: ["key"], where: { userId: user.id }, _count: { _all: true } }),
    lastSemester
      ? getUserPointsSummary(user.id, {
          from: new Date(`${lastSemester.start}T00:00:00+08:00`),
          to: new Date(new Date(`${lastSemester.end}T00:00:00+08:00`).getTime() + DAY_MS),
        })
      : Promise.resolve(null),
  ]);

  const unlocked = progress.filter((a) => a.unlockedAt);
  const name = (a: { name: string; nameZh: string }) => (zh ? a.nameZh : a.name);

  out.PROFILE_POINTS = { t: "stat", value: user.communityScore.toLocaleString("en-US"), label: t("communityPoints") };
  out.PROFILE_ACHIEVEMENTS = {
    t: "stat",
    value: `${unlocked.length}`,
    label: t("achievementsUnlocked"),
    sub: t("ofTotal", { n: ACHIEVEMENTS.length }),
  };

  const lbItems: WvItem[] = top.map((e) => ({ id: e.userId, primary: `#${e.rank} ${e.userId === user.id ? t("you") : e.name}`, secondary: `${e.points.toLocaleString("en-US")} pts` }));
  if (higher !== null && !top.some((e) => e.userId === user.id)) {
    lbItems.push({ id: "me", primary: `#${higher + 1} ${t("you")}`, secondary: `${user.communityScore.toLocaleString("en-US")} pts` });
  }
  out.PROFILE_LEADERBOARD = { t: "list", items: lbItems, empty: t("leaderboardEmpty") };

  // Closest-to-unlocking achievement, by the fraction of its condition already met.
  const counts = new Map(keyCounts.map((k) => [k.key, k._count._all]));
  const sourcesEarned = new Set(keyCounts.flatMap((k) => (isActivityKey(k.key) ? [ACTIVITY_RULES[k.key].source] : []))).size;
  const fraction = (a: (typeof progress)[number]): number => {
    const w = a.when;
    if (w.kind === "count") return Math.min(1, w.keys.reduce((s, k) => s + (counts.get(k) ?? 0), 0) / w.n);
    if (w.kind === "sources") return Math.min(1, sourcesEarned / w.n);
    if (w.kind === "total") return Math.min(1, user.communityScore / w.n);
    return Math.min(1, unlocked.length / w.n);
  };
  const next = progress
    .filter((a) => !a.unlockedAt)
    .map((a) => ({ a, f: fraction(a) }))
    .sort((x, y) => y.f - x.f || y.a.points - x.a.points)[0];
  out.PROFILE_NEXT_ACHIEVEMENT = next
    ? {
        t: "progress",
        pct: Math.round(next.f * 100),
        value: `${next.a.emoji} ${name(next.a)}`,
        label: zh ? next.a.descriptionZh : next.a.description,
        sub: `${Math.round(next.f * 100)}% · +${next.a.points} pts`,
      }
    : empty(t("allAchievementsUnlocked"));

  out.PROFILE_RECENT_POINTS = {
    t: "list",
    empty: t("noPointsYet"),
    items: recent.map((r) => {
      let label = r.key;
      if (isAchievementKey(r.key)) {
        const def = ACHIEVEMENT_BY_ID[r.key.slice(4)];
        if (def) label = `${def.emoji} ${name(def)}`;
      } else if (isActivityKey(r.key)) {
        const rule = ACTIVITY_RULES[r.key];
        label = zh ? rule.labelZh : rule.label;
      }
      return { id: r.id, primary: label, secondary: `+${r.points} · ${ago(r.createdAt)}` };
    }),
  };

  const rarest = unlocked
    .map((a) => ({ a, pct: completion[a.id] ?? 100 }))
    .sort((x, y) => x.pct - y.pct || (y.a.unlockedAt!.getTime() - x.a.unlockedAt!.getTime()))[0];
  out.PROFILE_SHOWCASE = rarest
    ? {
        t: "spot",
        kicker: t("rarestUnlocked"),
        title: `${rarest.a.emoji} ${name(rarest.a)}`,
        body: zh ? rarest.a.descriptionZh : rarest.a.description,
        foot: t("percentHaveIt", { n: rarest.pct }),
      }
    : empty(t("noAchievementsYet"));

  if (!lastSemester) out.PROFILE_RECAP = empty(t("noRecapYet"));
  else {
    const total = recap?.total ?? 0;
    const actions = recap?.sources.reduce((s, x) => s + x.count, 0) ?? 0;
    const topSource = recap ? [...recap.sources].sort((a, b) => b.points - a.points)[0] : null;
    out.PROFILE_RECAP = total
      ? {
          t: "stat",
          value: `+${total.toLocaleString("en-US")}`,
          label: t("recapLabel", { semester: lastSemester.label }),
          sub: topSource
            ? t("recapSub", { n: actions, source: zh ? topSource.labelZh : topSource.label })
            : t("recapActions", { n: actions }),
        }
      : { t: "empty", label: t("recapNothing", { semester: lastSemester.label }) };
  }
  void POINT_SOURCES;
  return out;
};

// ---------------------------------------------------------------------------------------------------------
// Campus / general
// ---------------------------------------------------------------------------------------------------------

/** Named breaks: every holiday on the calendar, plus the long gaps between the fall/spring terms and summer. */
function upcomingBreaks(now: Date): { label: string; start: string; end: string }[] {
  const { sessions, holidays } = ACADEMIC_CALENDAR;
  const breaks = holidays.map((h) => ({ label: h.label, start: h.start, end: h.end }));
  const fallEnd = sessions.find((s) => s.key === "fall-s2")?.end;
  const springStart = sessions.find((s) => s.key === "spring-s1")?.start;
  const springEnd = sessions.find((s) => s.key === "spring-s2")?.end;
  const dayAfter = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  const dayBefore = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
  if (fallEnd && springStart) breaks.push({ label: "Winter break", start: dayAfter(fallEnd), end: dayBefore(springStart) });
  if (springEnd) breaks.push({ label: "Summer break", start: dayAfter(springEnd), end: dayAfter(dayAfter(dayAfter(springEnd))) });
  return breaks.filter((b) => daysUntilDate(b.end, now) >= 0).sort((a, b) => a.start.localeCompare(b.start));
}

const BREAK_LABELS_ZH: Record<string, string> = {
  "Mid-Autumn Festival": "中秋节",
  "National Day": "国庆节",
  "Spring Festival": "春节",
  "Qing Ming Festival": "清明节",
  "Labor Day": "劳动节",
  "Winter break": "寒假",
  "Summer break": "暑假",
};

const loadCampus: Loader = async ({ user, now, t, locale }) => {
  const out: Record<string, WV> = {};

  // Next break / holiday
  const nextBreak = upcomingBreaks(now)[0];
  if (!nextBreak) out.CAMPUS_BREAK_COUNTDOWN = empty(t("noBreaks"));
  else {
    const label = locale === "zh" ? (BREAK_LABELS_ZH[nextBreak.label] ?? nextBreak.label) : nextBreak.label;
    const days = daysUntilDate(nextBreak.start, now);
    out.CAMPUS_BREAK_COUNTDOWN =
      days <= 0
        ? { t: "stat", value: t("now"), label, sub: t("breakEnds", { date: formatCampus(`${nextBreak.end}T12:00:00+08:00`, "MMM d") }) }
        : { t: "stat", value: `${days}d`, label, sub: formatCampus(`${nextBreak.start}T12:00:00+08:00`, "EEE MMM d") };
  }

  // Semester progress
  const status = getCurrentSessionStatus(now);
  const { sessions } = ACADEMIC_CALENDAR;
  const semesterOf = (key: string) => (key.startsWith("fall") ? ["fall-s1", "fall-s2"] : ["spring-s1", "spring-mini", "spring-s2"]);
  if (status.inSession) {
    const keys = semesterOf(status.session.key);
    const inSemester = sessions.filter((s) => keys.includes(s.key));
    const start = inSemester[0].start;
    const end = inSemester[inSemester.length - 1].end;
    const total = daysUntilDate(end, now) - daysUntilDate(start, now) + 1;
    const elapsed = -daysUntilDate(start, now) + 1;
    const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    const weeksLeft = Math.max(0, Math.ceil(daysUntilDate(end, now) / 7));
    out.CAMPUS_SEMESTER_PROGRESS = {
      t: "progress",
      pct,
      value: `${pct}%`,
      label: t("sessionWeek", { session: status.session.label, week: status.week, total: status.totalWeeks }),
      sub: t("weeksLeft", { n: weeksLeft }),
    };
  } else if (status.nextSession) {
    out.CAMPUS_SEMESTER_PROGRESS = {
      t: "progress",
      pct: 0,
      value: `${Math.max(0, daysUntilDate(status.nextSession.start, now))}d`,
      label: t("untilSession", { session: status.nextSession.label }),
      sub: formatCampus(`${status.nextSession.start}T12:00:00+08:00`, "EEE MMM d"),
    };
  } else out.CAMPUS_SEMESTER_PROGRESS = empty(t("noSessions"));

  // Contacts
  const zh = locale === "zh";
  out.CAMPUS_CONTACTS = {
    t: "contacts",
    items: [...NATIONAL_EMERGENCY, ...CAMPUS_CONTACTS].map((c) => ({ id: c.id, label: zh ? c.labelZh : c.label, number: c.number })),
  };
  out.CAMPUS_QUICK_LINKS = { t: "launch", text: "", cta: "" };
  out.CAMPUS_DUAL_CLOCK = { t: "launch", text: "", cta: "" };
  out.MARKET_POST_LAUNCH = { t: "launch", text: t("sellSomething"), cta: t("openMarketplace") };
  out.EVENTS_HOST_LAUNCH = { t: "launch", text: t("hostAnEvent"), cta: t("createEvent") };
  out.DEAR_WRITE = { t: "launch", text: t("writeForDearDku"), cta: t("submitAPiece") };

  // External data + per-user
  const [weather, air, rates, visits] = await Promise.all([
    fetchKunshanWeather(),
    fetchKunshanAirQuality(),
    fetchCnyRates(),
    user ? recordVisitAndGetStreak(user.id, now) : Promise.resolve(null),
  ]);

  out.CAMPUS_WEATHER = weather
    ? {
        t: "stat",
        value: `${WEATHER_EMOJI[weather.category]} ${weather.temp}°`,
        label: t(`wx_${weather.category}`),
        sub: t("highLow", { high: weather.high, low: weather.low }),
      }
    : empty(t("weatherUnavailable"));
  out.CAMPUS_AIR_QUALITY = air
    ? {
        t: "stat",
        value: String(air.aqi),
        label: t(`aqi_${air.band}`),
        sub: air.pm25 === null ? undefined : t("pm25", { n: air.pm25 }),
      }
    : empty(t("airUnavailable"));
  out.CAMPUS_CURRENCY = { t: "currency", rates };

  if (!user) out.CAMPUS_LOGIN_STREAK = empty(t("logInToSee"));
  else if (!visits) out.CAMPUS_LOGIN_STREAK = empty(t("streakUnavailable"));
  else
    out.CAMPUS_LOGIN_STREAK = {
      t: "stat",
      value: `🔥 ${visits.streak}`,
      label: t(visits.streak === 1 ? "dayStreakOne" : "dayStreakMany"),
      sub: t("totalVisitDays", { n: visits.totalDays }),
    };

  // Admin: distinct people who opened the dashboard today / in the last 7 campus days.
  if (user?.role === "ADMIN") {
    const today = campusDayKey(now);
    const weekStart = campusDayKey(addCampusDays(now, -6));
    const [todayRows, weekRows] = await Promise.all([
      prisma.dailyVisit.count({ where: { day: today } }),
      prisma.dailyVisit.findMany({ where: { day: { gte: weekStart } }, distinct: ["userId"], select: { userId: true } }),
    ]);
    out.ADMIN_ACTIVE_USERS = { t: "stat", value: String(todayRows), label: t("activeToday"), sub: t("activeThisWeek", { n: weekRows.length }) };
  }
  return out;
};

// ---------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------
// Chat unread/mentions and friends
// ---------------------------------------------------------------------------------------------------------

const loadSocial: Loader = async ({ user, now, t, locale }) => {
  const kinds = ["CHAT_UNREAD", "CHAT_MENTIONS", "FRIENDS_ONLINE", "FRIENDS_ACTIVITY", "FRIENDS_BIRTHDAYS"];
  if (!user) return Object.fromEntries(kinds.map((k) => [k, empty(t("logInToSee"))]));
  const tf = makeT("friends", locale);

  const [channels, mentionRows, mentionCounts, online, activity, birthdays] = await Promise.all([
    prisma.chatChannel.findMany({
      where: { OR: [{ id: "general" }, { members: { some: { userId: user.id } } }] },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    }),
    prisma.chatMention.findMany({
      where: { userId: user.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { message: { include: { author: { select: { firstName: true } }, channel: { select: { id: true, name: true, kind: true } } } } },
    }),
    getMentionCounts(user.id),
    getOnlineFriends(user.id),
    getFriendActivity(user.id, 4),
    getUpcomingBirthdays(user.id, 45, now),
  ]);

  const unread = await getUnreadCounts(user, channels.map((c) => c.id));
  const nameOf = (c: (typeof channels)[number]) => (c.kind === "DIRECT" ? dmChannelName(c, user.id) : c.name);
  const total = Object.values(unread).reduce((a, b) => a + b, 0);
  const busiest = [...channels].sort((a, b) => (unread[b.id] ?? 0) - (unread[a.id] ?? 0))[0];
  const mentionTotal = Object.values(mentionCounts).reduce((a, b) => a + b, 0);

  const out: Record<string, WV> = {};
  out.CHAT_UNREAD = {
    t: "stat",
    value: total > 99 ? "99+" : String(total),
    label: total === 0 ? t("allCaughtUp") : t(total === 1 ? "unreadOne" : "unreadMany"),
    sub: total > 0 && busiest ? t("mostIn", { name: nameOf(busiest) }) : mentionTotal > 0 ? t("mentionsWaiting", { n: mentionTotal }) : undefined,
  };
  out.CHAT_MENTIONS = {
    t: "list",
    empty: t("noMentions"),
    items: mentionRows.map((m) => ({
      id: m.id,
      primary: `${m.message.author.firstName}: ${clip(m.message.body, 70)}`,
      secondary: `${m.message.channel.kind === "DIRECT" ? t("directMessage") : m.message.channel.name} · ${ago(m.message.createdAt)}`,
    })),
  };
  out.FRIENDS_ONLINE = {
    t: "list",
    empty: t("noFriendsOnline"),
    items: online.slice(0, 4).map((p) => ({ id: p.id, primary: p.name, secondary: tf("online") })),
  };
  out.FRIENDS_ACTIVITY = {
    t: "list",
    empty: t("noFriendUpdates"),
    items: activity.map((a) => ({
      id: a.id,
      primary: tf(`act_${a.kind}`, { name: a.name, subject: locale === "zh" && a.subjectZh ? a.subjectZh : a.subject }),
      secondary: ago(new Date(a.at)),
    })),
  };
  out.FRIENDS_BIRTHDAYS = {
    t: "list",
    empty: t("noBirthdays"),
    items: birthdays.slice(0, 4).map((b) => ({
      id: b.id,
      primary: b.name,
      secondary:
        b.daysAway === 0
          ? t("birthdayToday")
          : `${formatCampus(new Date(Date.UTC(2000, b.month - 1, b.day, 12)), "MMM d")} · ${t(b.daysAway === 1 ? "inOneDay" : "inDays", { n: b.daysAway })}`,
    })),
  };
  return out;
};

const loaders: [string, Loader][] = [
  ["social", loadSocial],
  ["events", loadEvents],
  ["slb", loadSlb],
  ["lilypad", loadLilypad],
  ["wisdom", loadWisdom],
  ["clubs", loadClubs],
  ["dearDku", loadDearDku],
  ["academics", loadAcademics],
  ["chat", loadChat],
  ["profile", loadProfile],
  ["campus", loadCampus],
];

/**
 * Builds the view model for every newer widget kind. Each group of widgets loads independently, so one slow or
 * failing source (a query, an external API) only blanks its own widgets; widgets missing from the result render a
 * "couldn't load" placeholder on the client.
 */
export async function loadWidgetExt(ctx: Ctx): Promise<WidgetExt> {
  const results = await Promise.all(
    loaders.map(async ([name, load]) => {
      try {
        return await load(ctx);
      } catch (err) {
        console.error(`Widget data group "${name}" failed:`, err);
        return {} as Record<string, WV | undefined>;
      }
    }),
  );
  return Object.assign({}, ...results) as WidgetExt;
}
