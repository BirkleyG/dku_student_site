"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { LoginModal } from "@/components/layout/LoginModal";
import { ChatBubbleList } from "@/components/chat/ChatThread";
import { Welcome } from "@/app/Welcome";
import { navItems } from "@/lib/nav";
import { navMenuTourBridge, dashboardEditTourBridge } from "@/lib/tourBridge";
import { Spotlight } from "./Spotlight";
import { InterestsPicker } from "./InterestsPicker";

const TAB_BLURB: Record<string, string> = {
  "/home": "Your dashboard — customizable widgets so everything you care about is at a glance.",
  "/events": "See what's happening on campus this week, or add your own once you're signed in.",
  "/eats": "DKU Eats — order student-cooked food right from here.",
  "/chat": "Chat — sitewide, group, and direct conversations with other students.",
  "/news": "Campus news, all in one feed.",
  "/wisdom": "DKU Wisdom — crowdsourced tips and advice from people who've been here.",
  "/clubs": "Browse and join student clubs.",
  "/courses": "Course info and reviews from students who've taken them.",
  "/professors": "Professor ratings and reviews.",
  "/marketplace": "Buy, sell, and trade with other students.",
  "/slb": "Student Life Board — updates from student government.",
};

type Stage =
  | "greeting"
  | "askName"
  | "chatIntro"
  | "spotlightHamburger"
  | "spotlightMenu"
  | "interests"
  | "tabTour"
  | "widgetEditToggle"
  | "widgetAddTile"
  | "widgetRemoveTile"
  | "widgetSave"
  | "accountOffer"
  | "createAccount";

export function OnboardingFlow({ onClose, onComplete }: { onClose: () => void; onComplete: (interests: string[]) => void }) {
  const [stage, setStage] = useState<Stage>("greeting");
  const [messages, setMessages] = useState<{ from: "dku" | "you"; text: string }[]>([
    { from: "dku", text: "Hello! Welcome to DKU Life." },
  ]);
  const [name, setName] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
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

  const advanceTab = () => {
    if (tabIndex + 1 >= selectedTabs.length) {
      navMenuTourBridge.set(false);
      say(`If you want full access, I can go ahead and create an account for you, ${name}.`);
      setStage("accountOffer");
      return;
    }
    setTabIndex((i) => i + 1);
    setStage("tabTour");
  };

  const startWidgetDemo = () => {
    navMenuTourBridge.set(false);
    dashboardEditTourBridge.set(true);
    setStage("widgetEditToggle");
  };

  const skipTour = () => {
    navMenuTourBridge.set(false);
    dashboardEditTourBridge.set(false);
    say(`If you want full access, I can go ahead and create an account for you, ${name}.`);
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
          body="This is every tab in DKU Life. Let's pick out what you care about."
          onNext={goToInterests}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "interests" ? <InterestsPicker items={navItems} onContinue={beginTabTour} /> : null}

      {stage === "tabTour" && currentTabItem ? (
        currentTabHref === "/home" ? (
          <Spotlight
            target={`nav-item-${currentTabHref}`}
            title={currentTabItem.label}
            body={TAB_BLURB[currentTabHref] ?? currentTabItem.label}
            onSkip={skipTour}
            actions={[
              { label: "Looks great!", onClick: advanceTab },
              { label: "Show me how", onClick: startWidgetDemo, primary: true },
            ]}
          />
        ) : (
          <Spotlight
            target={`nav-item-${currentTabHref}`}
            title={currentTabItem.label}
            body={TAB_BLURB[currentTabHref] ?? currentTabItem.label}
            onNext={advanceTab}
            onSkip={skipTour}
            nextLabel={tabIndex + 1 >= selectedTabs.length ? "Done" : "Next"}
          />
        )
      ) : null}

      {stage === "widgetEditToggle" ? (
        <Spotlight
          target="widget-edit-toggle"
          title="Edit your widgets"
          body="Click this to rearrange, add, or remove widgets from your dashboard."
          onNext={() => setStage("widgetAddTile")}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "widgetAddTile" ? (
        <Spotlight
          target="widget-add-tile"
          title="Add a widget"
          body="This opens the widget gallery — pick anything you'd like to pin to your dashboard."
          onNext={() => setStage("widgetRemoveTile")}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "widgetRemoveTile" ? (
        <Spotlight
          target="widget-remove-tile"
          title="Remove a widget"
          body="Tap the little X on any tile to take it off your dashboard."
          onNext={() => setStage("widgetSave")}
          onSkip={skipTour}
        />
      ) : null}

      {stage === "widgetSave" ? (
        <Spotlight
          target="widget-edit-toggle"
          title="Save your layout"
          body="Hit Done when you're happy — your layout saves automatically."
          nextLabel="Got it"
          onNext={() => {
            dashboardEditTourBridge.set(false);
            navMenuTourBridge.set(true);
            advanceTab();
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
