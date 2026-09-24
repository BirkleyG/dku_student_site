"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { studentEmailDomains } from "@/lib/validation";
import { InstallGuide } from "@/components/install/InstallGuide";

type Lang = "en" | "zh";

const copy = {
  en: {
    greeting: "Hey! Welcome to DKU Life. Which language do you prefer?",
    english: "English",
    chinese: "中文",
    intro: "Hey, welcome to DKU Life. Are you a DKU student?",
    yes: "Yes",
    no: "No",
    notStudent:
      "No worries, I'll take you to the dashboard. Look around and see what's there. Come back and make an account once you're a student.",
    goToDashboard: "Take me there",
    askFirstName: "Great! What's your first name?",
    namePlaceholder: "Your first name",
    niceToMeet: (name: string) =>
      `Nice to meet you ${name}. Want me to take you straight to the dashboard, or should we keep going?`,
    dashboard: "Dashboard",
    continueBtn: "Continue",
    askNetId: "What is your netID? That'll let us make you an account.",
    netIdPlaceholder: "e.g. btg33",
    gotLetter: (letter: string) => `Got it. Your last name starts with a ${letter}.`,
    letterQuestion: "Should I stick with that, or do you want to give me your full name?",
    stickWithIt: "Stick with it",
    giveFullName: "Give full name",
    askFullName: "What's your full name?",
    fullNamePlaceholder: "First Last",
    askInviteCode: "We're in early beta, so it's invite-only right now. What's your invite code?",
    inviteCodePlaceholder: "e.g. K7M2Q9PX",
    askPassword: (name: string) => `Sounds good. Last question ${name}. Could you give me a secure password for next time you want to sign up?`,
    passwordPlaceholder: "At least 8 characters",
    settingUp: "Setting up your account…",
    allSet: "Great! I have your account set up. Enjoying using DKU Life and making this campus a better place.",
    submit: "↵",
    somethingWrong: "Something went wrong. Try again?",
    pwaIntro:
      "One more thing: want DKU Life on your home screen? It opens instantly and feels like a real app.",
    pwaContinue: "Got it, take me to the dashboard",
  },
  zh: {
    greeting: "你好！欢迎来到 DKU Life。你更喜欢哪种语言？",
    english: "English",
    chinese: "中文",
    intro: "欢迎来到 DKU Life，我很想带你四处看看。你是昆山杜克大学的学生吗？",
    yes: "是",
    no: "不是",
    notStudent: "没关系，我带你去 DKU 仪表盘。欢迎随便看看，了解更多信息。如果你有任何问题，我很乐意回答。",
    goToDashboard: "带我去看看",
    askFirstName: "太好了！你的名字是？",
    namePlaceholder: "你的名字",
    niceToMeet: (name: string) => `很高兴认识你，${name}。如果你愿意，我可以直接带你去仪表盘，或者我们可以再聊聊。`,
    dashboard: "仪表盘",
    continueBtn: "继续",
    askNetId: "你的 netID 是什么？这样我们就能帮你创建账户了。",
    netIdPlaceholder: "例如 btg33",
    gotLetter: (letter: string) => `明白了，你的姓氏首字母是 ${letter}。`,
    letterQuestion: "要用这个，还是你想告诉我你的全名？",
    stickWithIt: "就用这个",
    giveFullName: "告诉你全名",
    askFullName: "你的全名是？",
    fullNamePlaceholder: "名 姓",
    askInviteCode: "我们现在是早期内测阶段，需要邀请码才能注册——你的邀请码是？",
    inviteCodePlaceholder: "例如 K7M2Q9PX",
    askPassword: (name: string) => `好的，最后一个问题，${name}。请给我一个安全的密码，下次登录时会用到。`,
    passwordPlaceholder: "至少 8 个字符",
    settingUp: "正在设置你的账户…",
    allSet: "太好了！你的账户已经设置好了。祝你使用 DKU Life 愉快，一起让这个校园变得更好。",
    submit: "↵",
    somethingWrong: "出了点问题，再试一次？",
    pwaIntro: "还有一件事——要把 DKU Life 添加到主屏幕吗？这样打开更快，全屏显示，用起来就像真正的 App。",
    pwaContinue: "好的，带我去仪表盘",
  },
} as const;

type Step =
  | "language"
  | "isStudent"
  | "notStudent"
  | "firstName"
  | "afterName"
  | "netId"
  | "confirmLetter"
  | "fullName"
  | "inviteCode"
  | "password"
  | "submitting"
  | "done"
  | "installPwa";

type Message = { from: "dku" | "you"; text: string };

function guessLastInitial(netId: string, lang: Lang) {
  const alpha = netId.replace(/[^a-zA-Z]/g, "");
  const letter = alpha.slice(-1).toUpperCase();
  return letter || (lang === "zh" ? "?" : "?");
}

export function Welcome({ variant = "page", onFinish }: { variant?: "page" | "modal"; onFinish?: () => void } = {}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("language");
  const [messages, setMessages] = useState<Message[]>([{ from: "dku", text: copy.en.greeting }]);
  const [firstName, setFirstName] = useState("");
  const [netId, setNetId] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = copy[lang];

  useEffect(() => {
    if (step === "firstName" || step === "netId" || step === "fullName" || step === "inviteCode" || step === "password") {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [step]);

  const say = (text: string) => setMessages((m) => [...m, { from: "dku", text }]);
  const echo = (text: string) => setMessages((m) => [...m, { from: "you", text }]);

  const pickLanguage = (picked: Lang) => {
    setLang(picked);
    echo(copy[picked] === copy.en ? "English" : "中文");
    const next = copy[picked];
    say(next.intro);
    setStep("isStudent");
  };

  const answerIsStudent = (isStudent: boolean) => {
    if (isStudent) {
      echo(t.yes);
      say(t.askFirstName);
      setStep("firstName");
    } else {
      echo(t.no);
      say(t.notStudent);
      setStep("notStudent");
    }
  };

  const submitFirstName = () => {
    const name = value.trim();
    if (!name) return;
    setFirstName(name);
    echo(name);
    setValue("");
    say(t.niceToMeet(name));
    setStep("afterName");
  };

  const goToInstallStep = (label: string) => {
    echo(label);
    say(t.pwaIntro);
    setStep("installPwa");
  };

  const finishToDashboard = () => {
    echo(t.pwaContinue);
    if (onFinish) {
      onFinish();
      router.refresh();
      return;
    }
    router.push("/home");
  };

  const chooseContinue = () => {
    echo(t.continueBtn);
    say(t.askNetId);
    setStep("netId");
  };

  const submitNetId = () => {
    const id = value.trim();
    if (!id) return;
    setNetId(id);
    echo(id);
    setValue("");
    const letter = guessLastInitial(id, lang);
    setLastName(`${letter}.`);
    say(`${t.gotLetter(letter)} ${t.letterQuestion}`);
    setStep("confirmLetter");
  };

  const stickWithLetter = () => {
    echo(t.stickWithIt);
    say(t.askInviteCode);
    setStep("inviteCode");
  };

  const wantFullName = () => {
    echo(t.giveFullName);
    say(t.askFullName);
    setStep("fullName");
  };

  const submitFullName = () => {
    const name = value.trim();
    if (!name) return;
    setLastName(name.split(/\s+/).slice(1).join(" ") || name);
    echo(name);
    setValue("");
    say(t.askInviteCode);
    setStep("inviteCode");
  };

  const submitInviteCode = () => {
    const code = value.trim();
    if (!code) return;
    setInviteCode(code);
    echo(code);
    setValue("");
    say(t.askPassword(firstName));
    setStep("password");
  };

  const submitPassword = async () => {
    if (isSubmitting) return;
    const password = value;
    if (password.length < 8) {
      setError(lang === "zh" ? "密码至少需要 8 个字符" : "Password must be at least 8 characters");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    echo("•".repeat(password.length));
    setValue("");
    say(t.settingUp);
    setStep("submitting");

    const domain = studentEmailDomains[0];
    const email = `${netId}@${domain}`;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, netId, email, password, inviteCode }),
      });

      if (!res.ok) {
        const body: { error?: string; field?: "inviteCode" | "email" } = await res.json().catch(() => ({}));
        const message: string = body.error ?? t.somethingWrong;
        setError(message);
        // Send them back to whichever field actually failed, not just the last one.
        // The server tells us via `field` (invalid/used/mismatched code, rate limit,
        // or an email/netID mismatch); fall back to sniffing the message for older
        // responses that don't set it.
        setStep(body.field === "inviteCode" || (!body.field && /invite code/i.test(message)) ? "inviteCode" : "password");
        return;
      }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        // Account was created but the automatic sign-in failed — let them
        // continue the flow anyway; they can log in manually from /login.
        setError(t.somethingWrong);
      }

      say(t.allSet);
      setStep("done");
    } catch {
      setError(t.somethingWrong);
      setStep("password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, submitFn: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitFn();
    }
  };

  const currentSubmit = useMemo(() => {
    switch (step) {
      case "firstName":
        return submitFirstName;
      case "netId":
        return submitNetId;
      case "fullName":
        return submitFullName;
      case "inviteCode":
        return submitInviteCode;
      case "password":
        return submitPassword;
      default:
        return () => {};
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, value, firstName, netId, lang]);

  return (
    <main
      lang={lang === "zh" ? "zh-CN" : "en"}
      className={
        variant === "modal"
          ? "relative flex flex-col"
          : "relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-white px-6"
      }
    >
      <div className="relative z-10 w-full max-w-xl">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <ChatBubble key={i} from={m.from}>
                {m.text}
              </ChatBubble>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === "language" ? (
            <ActionRow key="language">
              <ChoiceButton onClick={() => pickLanguage("en")}>English</ChoiceButton>
              <ChoiceButton onClick={() => pickLanguage("zh")}>中文</ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "isStudent" ? (
            <ActionRow key="isStudent">
              <ChoiceButton onClick={() => answerIsStudent(true)}>{t.yes}</ChoiceButton>
              <ChoiceButton onClick={() => answerIsStudent(false)}>{t.no}</ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "notStudent" ? (
            <ActionRow key="notStudent">
              <ChoiceButton primary onClick={() => goToInstallStep(t.goToDashboard)}>
                {t.goToDashboard}
              </ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "firstName" ? (
            <TextInputRow
              key="firstName"
              inputRef={inputRef}
              value={value}
              placeholder={t.namePlaceholder}
              onChange={setValue}
              onKeyDown={(e) => onKeyDown(e, currentSubmit)}
              onSubmit={currentSubmit}
              submitLabel={t.submit}
            />
          ) : null}

          {step === "afterName" ? (
            <ActionRow key="afterName">
              <ChoiceButton onClick={() => goToInstallStep(t.dashboard)}>{t.dashboard}</ChoiceButton>
              <ChoiceButton primary onClick={chooseContinue}>
                {t.continueBtn}
              </ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "netId" ? (
            <TextInputRow
              key="netId"
              inputRef={inputRef}
              value={value}
              placeholder={t.netIdPlaceholder}
              onChange={setValue}
              onKeyDown={(e) => onKeyDown(e, currentSubmit)}
              onSubmit={currentSubmit}
              submitLabel={t.submit}
            />
          ) : null}

          {step === "confirmLetter" ? (
            <ActionRow key="confirmLetter">
              <ChoiceButton onClick={stickWithLetter}>{t.stickWithIt}</ChoiceButton>
              <ChoiceButton primary onClick={wantFullName}>
                {t.giveFullName}
              </ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "fullName" ? (
            <TextInputRow
              key="fullName"
              inputRef={inputRef}
              value={value}
              placeholder={t.fullNamePlaceholder}
              onChange={setValue}
              onKeyDown={(e) => onKeyDown(e, currentSubmit)}
              onSubmit={currentSubmit}
              submitLabel={t.submit}
            />
          ) : null}

          {step === "inviteCode" ? (
            <TextInputRow
              key="inviteCode"
              inputRef={inputRef}
              value={value}
              placeholder={t.inviteCodePlaceholder}
              onChange={setValue}
              onKeyDown={(e) => onKeyDown(e, currentSubmit)}
              onSubmit={currentSubmit}
              submitLabel={t.submit}
            />
          ) : null}

          {step === "password" ? (
            <TextInputRow
              key="password"
              inputRef={inputRef}
              value={value}
              type="password"
              placeholder={t.passwordPlaceholder}
              onChange={setValue}
              onKeyDown={(e) => onKeyDown(e, currentSubmit)}
              onSubmit={currentSubmit}
              submitLabel={t.submit}
            />
          ) : null}

          {step === "done" ? (
            <ActionRow key="done">
              <ChoiceButton primary onClick={() => goToInstallStep(t.dashboard)}>
                {t.dashboard}
              </ChoiceButton>
            </ActionRow>
          ) : null}

          {step === "installPwa" ? (
            <motion.div
              key="installPwa"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5"
            >
              <InstallGuide lang={lang} />
              <div className="mt-5 flex flex-wrap gap-3">
                <ChoiceButton primary onClick={finishToDashboard}>
                  {t.pwaContinue}
                </ChoiceButton>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>
    </main>
  );
}

function ChatBubble({ from, children }: { from: "dku" | "you"; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${from === "you" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:text-base ${
          from === "you" ? "bg-ink text-white" : "bg-paper-dim text-ink/85"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 flex flex-wrap gap-3"
    >
      {children}
    </motion.div>
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

function TextInputRow({
  inputRef,
  value,
  placeholder,
  onChange,
  onKeyDown,
  onSubmit,
  submitLabel,
  type = "text",
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  submitLabel: string;
  type?: "text" | "password";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 flex gap-2"
    >
      <input
        ref={inputRef}
        autoFocus
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="focus-ring w-full rounded-2xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
      />
      <button
        onClick={onSubmit}
        className="focus-ring shrink-0 rounded-2xl bg-gold px-5 text-sm font-medium text-ink transition-transform hover:-translate-y-0.5 hover:bg-gold-bright"
      >
        {submitLabel}
      </button>
    </motion.div>
  );
}
