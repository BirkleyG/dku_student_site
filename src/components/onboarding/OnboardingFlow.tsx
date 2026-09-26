"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginModal } from "@/components/layout/LoginModal";
import { ChatBubbleList } from "@/components/chat/ChatThread";
import { Welcome } from "@/app/Welcome";
import { navItems } from "@/lib/nav";
import { navMenuTourBridge, dashboardEditTourBridge } from "@/lib/tourBridge";
import { Spotlight } from "./Spotlight";
import { InterestsPicker } from "./InterestsPicker";

type DeepDiveStep = { target: string; title: string; body: string };

type TabConfig = {
  blurb: string;
  /** When present, the tab step offers "Explain more" — a real, in-place walkthrough of the page. */
  deepDive?: DeepDiveStep[];
  /** Guests get redirected to /login on this route, so the deep dive is only offered when signed in. */
  requiresAuth?: boolean;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  "/home": {
    blurb: "Your dashboard — customizable widgets so everything you care about is at a glance.",
    deepDive: [
      {
        target: "widget-edit-toggle",
        title: "Edit your widgets",
        body: "Click this to rearrange, add, or remove widgets from your dashboard.",
      },
      {
        target: "widget-add-tile",
        title: "Add a widget",
        body: "This opens the widget gallery — pick anything you'd like to pin to your dashboard.",
      },
      {
        target: "widget-remove-tile",
        title: "Remove a widget",
        body: "Tap the little X on any tile to take it off your dashboard.",
      },
      {
        target: "widget-edit-toggle",
        title: "Save your layout",
        body: "Hit Done when you're happy — your layout saves automatically.",
      },
    ],
  },
  "/events": {
    blurb: "See what's happening on campus this week, or add your own once you're signed in.",
    deepDive: [
      {
        target: "events-calendar",
        title: "Browse events",
        body: "Switch between month, week, and day views, or jump to any day to see what's on.",
      },
      {
        target: "events-host-btn",
        title: "Host your own",
        body: "Once you're signed in, tap here to publish an event of your own.",
      },
    ],
  },
  "/eats": {
    blurb: "DKU Eats — order student-cooked food right from here.",
    deepDive: [
      {
        target: "eats-embed",
        title: "DKU Eats",
        body: "Browse restaurants, click one to see the menu, and place an order — it all happens right here, embedded in the site.",
      },
    ],
  },
  "/chat": {
    blurb: "Chat — sitewide, group, and direct conversations with other students.",
    requiresAuth: true,
    deepDive: [
      {
        target: "chat-channel-list",
        title: "Channels & DMs",
        body: "The General channel is open to everyone. Join a group with an invite code, or start a direct message with another student.",
      },
      {
        target: "chat-composer",
        title: "Say something",
        body: "Type here to post in whichever channel or DM you've got open.",
      },
    ],
  },
  "/news": {
    blurb: "Campus news, all in one feed.",
    deepDive: [{ target: "news-feed", title: "News", body: "Filter by category and scroll through the latest campus stories." }],
  },
  "/wisdom": {
    blurb: "DKU Wisdom — crowdsourced tips and advice from people who've been here.",
    deepDive: [
      { target: "wisdom-list", title: "Browse topics", body: "Real questions and advice from other students, organized by topic." },
      {
        target: "wisdom-start-btn",
        title: "Ask your own",
        body: "Once you're signed in, start a topic to ask the community something.",
      },
    ],
  },
  "/clubs": {
    blurb: "Browse and join student clubs.",
    deepDive: [
      { target: "clubs-directory", title: "Find a club", body: "Every student club at DKU, searchable in one place." },
      { target: "clubs-add-btn", title: "Add a club", body: "Once you're signed in, add a club that isn't listed yet." },
    ],
  },
  "/courses": {
    blurb: "Course info and reviews from students who've taken them.",
    deepDive: [
      { target: "courses-directory", title: "Find a course", body: "Search courses and read reviews from students who've taken them." },
      { target: "courses-add-btn", title: "Add a course", body: "Once you're signed in, add a course that's missing." },
    ],
  },
  "/professors": {
    blurb: "Professor ratings and reviews.",
    deepDive: [
      { target: "professors-directory", title: "Find a professor", body: "Search professors and see what other students thought of their classes." },
      { target: "professors-add-btn", title: "Add a professor", body: "Once you're signed in, add a professor who's missing." },
    ],
  },
  "/marketplace": {
    blurb: "Buy, sell, and trade with other students.",
    deepDive: [
      {
        target: "marketplace-embed",
        title: "DKU Marketplace",
        body: "Browse listings, message a seller, and post your own — embedded right here too.",
      },
    ],
  },
  "/slb": {
    blurb: "Student Life Board — updates from student government.",
    deepDive: [
      { target: "slb-about", title: "About SLB", body: "What the Student Life Board does, and how to reach them." },
      {
        target: "slb-initiatives",
        title: "Initiatives on the floor",
        body: "Proposals currently being considered — back the ones you care about.",
      },
    ],
  },
};

type Stage = "greeting" | "askName" | "chatIntro" | "spotlightHamburger" | "spotlightMenu" | "interests" | "tabTour" | "deepDive" | "accountOffer" | "createAccount";

export function OnboardingFlow({ onClose, onComplete }: { onClose: () => void; onComplete: (interests: string[]) => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const [stage, setStage] = useState<Stage>("greeting");
  const [messages, setMessages] = useState<{ from: "dku" | "you"; text: string }[]>([
    { from: "dku", text: "Hello! Welcome to DKU Life." },
  ]);
  const [name, setName] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [deepDiveIndex, setDeepDiveIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (text: string) => setMessages((m) => [...m, { from: "dku", text }]);
  const echo = (text: string) => setMessages((m) => [...m, { from: "you", text }]);

  const wantsTour = () => {
    echo("What is this place?");
    say("I'd love to show you around. What can I call you?");
    setStage("askName");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const declineTour = () => {
    echo("Thanks!");
    onClose();
  };

  const submitName = () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setName(trimmed);
    echo(trimmed);
    setNameValue("");
    say(`Oh great, hello ${trimmed}! Let me show you a bit about what this is.`);
    setStage("chatIntro");
  };

  const startTour = () => {
    echo("Let's go!");
    setStage("spotlightHamburger");
  };

  const openMenuAndContinue = () => {
    navMenuTourBridge.set(true);
    setStage("spotlightMenu");
  };

  const goToInterests = () => {
    setStage("interests");
  };

  const beginTabTour = (interests: string[]) => {
    setSelectedTabs(interests.length ? interests : navItems.map((i) => i.href));
    setTabIndex(0);
    setStage("tabTour");
  };

  const currentTabHref = selectedTabs[tabIndex];
  const currentTabItem = navItems.find((i) => i.href === currentTabHref);
  const currentTabConfig = currentTabHref ? TAB_CONFIG[currentTabHref] : undefined;

  const advanceTab = () => {
    if (tabIndex + 1 >= selectedTabs.length) {
      navMenuTourBridge.set(false);
      say(
        `That's the tour! You can always rewatch it from the "?" next to the menu. If you want full access, I can go ahead and create an account for you, ${name}.`,
      );
      setStage("accountOffer");
      return;
    }
    setTabIndex((i) => i + 1);
    setStage("tabTour");
  };

  const startDeepDive = () => {
    if (!currentTabHref || !currentTabConfig?.deepDive) return;
    navMenuTourBridge.set(false);
    // Navigate unconditionally (a no-op if we're already there) — the tour
    // can be replayed from any page via the "?" menu, so we can't assume
    // we're still sitting on whichever tab this step belongs to.
    router.push(currentTabHref);
    if (currentTabHref === "/home") {
      dashboardEditTourBridge.set(true);
    }
    setDeepDiveIndex(0);
    setStage("deepDive");
  };

  const finishDeepDive = () => {
    if (currentTabHref === "/home") {
      dashboardEditTourBridge.set(false);
    }
    setDeepDiveIndex(null);
    navMenuTourBridge.set(true);
    advanceTab();
  };

  const skipTour = () => {
    navMenuTourBridge.set(false);
    dashboardEditTourBridge.set(false);
    say(
      `That's the tour! You can always rewatch it from the "?" next to the menu. If you want full access, I can go ahead and create an account for you, ${name}.`,
    );
    setStage("accountOffer");
  };

  const wantsAccount = () => {
    echo("Create my account");
    setStage("createAccount");
  };

  const finishWithoutAccount = () => {
    echo("Maybe later");
    onComplete(selectedTabs);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitName();
    }
  };

  const modalContent = useMemo(() => {
    switch (stage) {
      case "greeting":
        return (
          <>
            <ChatBubbleList messages={messages} />
            <div className="mt-5 flex flex-wrap gap-3">
              <ChoiceButton primary onClick={wantsTour}>
                What is this place?
              </ChoiceButton>
              <ChoiceButton onClick={declineTour}>Thanks!</ChoiceButton>
            </div>
          </>
        );
      case "askName":
        return (
          <>
            <ChatBubbleList messages={messages} />
            <div className="mt-5 flex gap-2">
              <input
                ref={inputRef}
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Your name"
                className="focus-ring w-full rounded-2xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
              />
              <button
                onClick={submitName}
                className="focus-ring shrink-0 rounded-2xl bg-gold px-5 text-sm font-medium text-ink hover:bg-gold-bright"
              >
                ↵
              </button>
            </div>
          </>
        );
      case "chatIntro":
        return (
          <>
            <ChatBubbleList
              messages={[
                ...messages,
                {
                  from: "dku",
                  text: "DKU Life is a place for all the scattered, disparate information at DKU to come together in one spot. Our goal is to make the experience intuitive, unified, and exciting as we all explore a new place, a new stage of life, and a new journey together.",
                },
              ]}
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <ChoiceButton primary onClick={startTour}>
                With that, let me introduce you.
              </ChoiceButton>
            </div>
          </>
        );
      case "accountOffer":
        return (
          <>
            <ChatBubbleList messages={messages} />
            <div className="mt-5 flex flex-wrap gap-3">
              <ChoiceButton primary onClick={wantsAccount}>
                Create my account
              </ChoiceButton>
              <ChoiceButton onClick={finishWithoutAccount}>Maybe later</ChoiceButton>
            </div>
          </>
        );
      case "createAccount":
        return <Welcome variant="modal" initialFirstName={name} onFinish={() => onComplete(selectedTabs)} />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, messages, nameValue, name, selectedTabs]);

  const showModal = ["greeting", "askName", "chatIntro", "accountOffer", "createAccount"].includes(stage);

  const canDeepDive = Boolean(currentTabConfig?.deepDive) && (!currentTabConfig?.requiresAuth || isLoggedIn);
  const isLastTab = tabIndex + 1 >= selectedTabs.length;
  const deepDiveSteps = currentTabConfig?.deepDive ?? [];
  const deepDiveStep = deepDiveIndex !== null ? deepDiveSteps[deepDiveIndex] : undefined;
  const isLastDeepDiveStep = deepDiveIndex !== null && deepDiveIndex + 1 >= deepDiveSteps.length;

  return (
    <>
      {showModal ? (
        <LoginModal
          labelledBy="onboarding-modal-title"
          className="sm:max-w-xl"
          onDismiss={stage === "createAccount" ? () => onComplete(selectedTabs) : onClose}
        >
          <h2 id="onboarding-modal-title" className="sr-only">
            Welcome to DKU Life
          </h2>
          {modalContent}
        </LoginModal>
      ) : null}

      {stage === "spotlightHamburger" ? (
        <Spotlight
          target="nav-hamburger"
          title="Your menu"
          body="Tap here any time to see every part of DKU Life."
          onNext={openMenuAndContinue}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "spotlightMenu" ? (
        <Spotlight
          target="nav-menu-list"
          title="Here's everything"
          body="This is every tab in DKU Life. Tap the star next to a tab to pin it to your header for quick access — let's pick out what you care about."
          onNext={goToInterests}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "interests" ? <InterestsPicker items={navItems} onContinue={beginTabTour} /> : null}

      {stage === "tabTour" && currentTabItem && currentTabConfig ? (
        canDeepDive ? (
          <Spotlight
            target={`nav-item-${currentTabHref}`}
            title={currentTabItem.label}
            body={currentTabConfig.blurb}
            onSkip={skipTour}
            actions={[
              { label: "Looks great!", onClick: advanceTab },
              { label: currentTabHref === "/home" ? "Show me how" : "Explain more", onClick: startDeepDive, primary: true },
            ]}
          />
        ) : (
          <Spotlight
            target={`nav-item-${currentTabHref}`}
            title={currentTabItem.label}
            body={currentTabConfig.blurb}
            onNext={advanceTab}
            onSkip={skipTour}
            nextLabel={isLastTab ? "Done" : "Next"}
          />
        )
      ) : null}

      {stage === "deepDive" && deepDiveStep ? (
        <Spotlight
          target={deepDiveStep.target}
          title={deepDiveStep.title}
          body={deepDiveStep.body}
          nextLabel={isLastDeepDiveStep ? "Continue tour" : "Next"}
          onNext={() => {
            if (isLastDeepDiveStep) finishDeepDive();
            else setDeepDiveIndex((i) => (i ?? 0) + 1);
          }}
          onSkip={skipTour}
        />
      ) : null}
    </>
  );
}

function ChoiceButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
        primary ? "bg-gold text-ink hover:bg-gold-bright" : "border border-ink text-ink hover:bg-ink hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
