import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Moon,
  Loader2,
  RotateCcw,
  X,
  KeyRound,
  Check,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { MAJOR_ARCANA, type DrawnCard, type TarotCard } from "@/lib/tarot";
import { getTarotReading } from "@/lib/reading.functions";
import { redeemCode, loadMyCode, TIER_LABEL } from "@/lib/unlock-codes";
import { PRESET_GROUPS, loadUsedPresets } from "@/lib/unlock-codes";
import wechatQr from "@/assets/wechat-qr.jpeg.asset.json";
import { useLanguage } from "@/hooks/use-language";

// ============ LEMON SQUEEZY CONFIG ============
const LEMON_SQUEEZY_LINKS: Record<string, string> = {
  basic:   "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/PRODUCT_ID_1",
  deep:    "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/PRODUCT_ID_2",
  relationship: "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/PRODUCT_ID_3",
};

const USD_PRICES: Record<string, string> = {
  basic: "$4.99",
  deep: "$9.99",
  relationship: "$19.99",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingxi Tarot · AI 塔罗占卜 | Instant AI Tarot Reading" },
      { name: "description", content: "默念你的问题，AI 塔罗为你揭示宇宙的指引。Instant AI tarot reading — whisper your question, the Universe will answer." },
      { property: "og:title", content: "Lingxi Tarot · AI 塔罗占卜" },
      { property: "og:description", content: "默念你的问题，让宇宙给你答案。Instant AI tarot reading." },
    ],
  }),
  component: Index,
});

type Step =
  | "name"
  | "topic"
  | "question"
  | "mood"
  | "ritual"
  | "pick"
  | "flip"
  | "interpreting"
  | "reading";
type Tier = "basic" | "deep" | "relationship";

function buildPool(): DrawnCard[] {
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5).slice(0, 6);
  return shuffled.map((card) => ({
    card,
    reversed: Math.random() < 0.4,
    position: "过去" as const,
  }));
}

function Index() {
  const { t, lang, setLang } = useLanguage();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [pool, setPool] = useState<DrawnCard[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [question, setQuestion] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<string>("");
  const [unlockedTier, setUnlockedTier] = useState<Tier | null>(null);
  const [error, setError] = useState<string>("");

  const fetchReading = useServerFn(getTarotReading);

  const topics = t.topics;
  const moods = t.moods;

  const startRitual = () => {
    setPool(buildPool());
    setPicks([]);
    setCards([]);
    setFlipped([false, false, false]);
    setStep("ritual");
  };

  const togglePick = (i: number) => {
    setPicks((prev) => {
      if (prev.includes(i) || prev.length >= 3) return prev;
      return [...prev, i];
    });
  };

  const confirmPicks = () => {
    if (picks.length !== 3) return;
    const positions: DrawnCard["position"][] = [t.positionPast as "过去", t.positionPresent as "现在", t.positionFuture as "未来"];
    const chosen = picks.map((idx, i) => ({
      ...pool[idx],
      position: positions[i],
    }));
    setCards(chosen);
    setFlipped([false, false, false]);
    setStep("flip");
  };

  const flip = (i: number) => {
    setFlipped((f) => {
      if (f[i]) return f;
      const next = [...f];
      next[i] = true;
      return next;
    });
  };

  const allFlipped = flipped.every(Boolean);

  const cardPayload = () =>
    cards.map((c) => ({
      name: `${c.card.name}${c.reversed ? `（${t.reversed}）` : `（${t.upright}）`}`,
      position: c.position,
      reversed: c.reversed,
      keywords: c.card.keywords,
    }));

  const buildQuestion = () => {
    const topicLabel = topics.find((tp) => tp.id === topic)?.label ?? "";
    return [
      name && `${name}`,
      topicLabel,
      question.trim() || "（直觉感应）",
    ]
      .filter(Boolean)
      .join("，");
  };

  const submitReading = async () => {
    setLoading(true);
    setError("");
    setStep("interpreting");
    try {
      const res = await fetchReading({
        data: {
          question: buildQuestion(),
          mood: mood.trim(),
          tier: "basic",
          cards: cardPayload(),
          lang: lang,
        },
      });
      setReading(res.reading);
      setUnlockedTier(null);
      setStep("reading");
      const my = loadMyCode();
      if (my && (my.tier === "basic" || my.tier === "deep")) {
        void unlockTier(my.tier);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.universeError);
      setStep("flip");
    } finally {
      setLoading(false);
    }
  };

  const unlockTier = async (tier: Tier, partner?: string, relation?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchReading({
        data: {
          question: buildQuestion(),
          mood: mood.trim(),
          tier,
          partner: partner ?? "",
          relation: relation ?? "",
          cards: cardPayload(),
          lang: lang,
        },
      });
      setReading(res.reading);
      setUnlockedTier(tier);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.universeError);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("name");
    setName("");
    setTopic("");
    setPool([]);
    setPicks([]);
    setCards([]);
    setFlipped([false, false, false]);
    setQuestion("");
    setMood("");
    setReading("");
    setUnlockedTier(null);
    setError("");
  };

  const toggleLang = () => {
    setLang(lang === "zh" ? "en" : "zh");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Starfield />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.22_300/0.25),transparent_60%)]" />

      {/* Language switcher */}
      <button
        onClick={toggleLang}
        className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-gold/30 bg-card/60 px-3 py-1.5 text-xs text-gold/80 backdrop-blur-xl transition-all hover:border-gold/60 hover:text-gold"
        aria-label="Switch language"
      >
        <Globe className="h-3 w-3" />
        {t.langLabel}
      </button>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-10 sm:px-8 sm:py-16">
        {step === "name" && (
          <NameStep name={name} setName={setName} onNext={() => setStep("topic")} t={t} />
        )}
        {step === "topic" && (
          <TopicStep
            topic={topic}
            setTopic={setTopic}
            onBack={() => setStep("name")}
            onNext={() => setStep("question")}
            t={t}
            topics={topics}
          />
        )}
        {step === "question" && (
          <QuestionStep
            question={question}
            setQuestion={setQuestion}
            onBack={() => setStep("topic")}
            onNext={() => setStep("mood")}
            t={t}
          />
        )}
        {step === "mood" && (
          <MoodStep
            mood={mood}
            setMood={setMood}
            onBack={() => setStep("question")}
            onNext={startRitual}
            t={t}
            moods={moods}
          />
        )}
        {step === "ritual" && <RitualStep onNext={() => setStep("pick")} t={t} />}
        {step === "pick" && (
          <PickStep
            pool={pool}
            picks={picks}
            onPick={togglePick}
            onConfirm={confirmPicks}
            t={t}
          />
        )}
        {step === "flip" && (
          <FlipStep
            cards={cards}
            flipped={flipped}
            onFlip={flip}
            allFlipped={allFlipped}
            onContinue={submitReading}
            error={error}
            t={t}
          />
        )}
        {step === "interpreting" && <InterpretingStep t={t} />}
        {step === "reading" && (
          <ReadingScreen
            cards={cards}
            reading={reading}
            unlockedTier={unlockedTier}
            loading={loading}
            error={error}
            onUnlock={unlockTier}
            onReset={reset}
            t={t}
            lang={lang}
          />
        )}

        <Footer t={t} />
      </main>
      <SecretCodeList t={t} />
    </div>
  );
}

/* ---------- Step shells ---------- */

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  t,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> {t.back}
        </button>
      )}
      <div className="mb-2 flex items-center gap-2 text-gold/80">
        <Moon className="h-4 w-4" />
        <span className="text-[10px] tracking-[0.4em] uppercase">LINGXI</span>
        <Moon className="h-4 w-4" />
      </div>
      <h2 className="text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-8 w-full max-w-xl">{children}</div>
    </section>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[oklch(0.82_0.15_85/0.6)] bg-gradient-to-r from-[oklch(0.3_0.15_295)] to-[oklch(0.35_0.18_280)] px-10 py-3.5 text-sm font-medium tracking-[0.2em] text-gold shadow-[0_0_30px_oklch(0.55_0.22_300/0.5)] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:text-base"
    >
      {children}
    </button>
  );
}

/* ---------- Step 1: Name ---------- */
function NameStep({
  name, setName, onNext, t,
}: {
  name: string; setName: (v: string) => void; onNext: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <StepShell title={t.stepNameTitle} t={t}>
      <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
          placeholder={t.stepNamePlaceholder}
          className="w-full rounded-lg border border-border bg-background/40 px-4 py-3.5 text-center text-base text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
          maxLength={30}
        />
        <div className="flex justify-center">
          <PrimaryButton disabled={!name.trim()} onClick={onNext}>
            {t.continue}
          </PrimaryButton>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground/70">{t.stepNameHint}</p>
    </StepShell>
  );
}

/* ---------- Step 2: Topic ---------- */
function TopicStep({
  topic, setTopic, onBack, onNext, t, topics,
}: {
  topic: string; setTopic: (v: string) => void; onBack: () => void; onNext: () => void;
  t: ReturnType<typeof useLanguage>["t"];
  topics: ReturnType<typeof useLanguage>["t"]["topics"];
}) {
  return (
    <StepShell title={t.stepTopicTitle} onBack={onBack} t={t}>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {topics.map((tp) => {
          const active = topic === tp.id;
          return (
            <button
              key={tp.id}
              onClick={() => setTopic(tp.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.03] sm:p-5 ${
                active
                  ? "border-gold/70 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.7)] to-[oklch(0.2_0.1_290/0.4)] shadow-[0_0_25px_oklch(0.55_0.22_300/0.5)]"
                  : "border-border/60 bg-card/40 hover:border-gold/40"
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${active ? "bg-gold/20 ring-2 ring-gold/60" : "bg-background/50"}`}>
                {tp.emoji}
              </div>
              <div className={`text-sm tracking-wider ${active ? "text-gold" : "text-foreground/80"}`}>
                {tp.label}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        <PrimaryButton disabled={!topic} onClick={onNext}>{t.continue}</PrimaryButton>
      </div>
    </StepShell>
  );
}

/* ---------- Step 3: Question ---------- */
function QuestionStep({
  question, setQuestion, onBack, onNext, t,
}: {
  question: string; setQuestion: (v: string) => void; onBack: () => void; onNext: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <StepShell title={t.stepQuestionTitle} subtitle={t.stepQuestionSubtitle} onBack={onBack} t={t}>
      <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
        <textarea
          autoFocus
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.stepQuestionPlaceholder}
          rows={5}
          className="w-full resize-none rounded-lg border border-border bg-background/40 px-4 py-3 text-sm leading-7 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
          maxLength={500}
        />
        <div className="flex justify-center">
          <PrimaryButton disabled={!question.trim()} onClick={onNext}>{t.continue}</PrimaryButton>
        </div>
      </div>
    </StepShell>
  );
}

/* ---------- Step 4: Mood ---------- */
function MoodStep({
  mood, setMood, onBack, onNext, t, moods,
}: {
  mood: string; setMood: (v: string) => void; onBack: () => void; onNext: () => void;
  t: ReturnType<typeof useLanguage>["t"];
  moods: ReturnType<typeof useLanguage>["t"]["moods"];
}) {
  return (
    <StepShell title={t.stepMoodTitle} onBack={onBack} t={t}>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {moods.map((m) => {
          const active = mood === m.label;
          return (
            <button
              key={m.label}
              onClick={() => setMood(m.label)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.03] sm:p-5 ${
                active
                  ? "border-gold/70 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.7)] to-[oklch(0.2_0.1_290/0.4)] shadow-[0_0_25px_oklch(0.55_0.22_300/0.5)]"
                  : "border-border/60 bg-card/40 hover:border-gold/40"
              }`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className={`text-sm tracking-wider ${active ? "text-gold" : "text-foreground/80"}`}>
                {m.label}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        <PrimaryButton disabled={!mood} onClick={onNext}>
          <Sparkles className="h-4 w-4" /> {t.beginDivination}
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

/* ---------- Step 5: Ritual ---------- */
function RitualStep({ onNext, t }: { onNext: () => void; t: ReturnType<typeof useLanguage>["t"] }) {
  const ritualText = t.stepRitualText;
  const [visibleChars, setVisibleChars] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChars((c) => {
        if (c >= ritualText.length) { clearInterval(interval); return c; }
        return c + 1;
      });
    }, 110);
    const timeout = setTimeout(() => setShowButton(true), 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [ritualText]);

  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
      <div className="relative mb-12 flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.25_300/0.7),oklch(0.3_0.2_290/0.3)_60%,transparent_75%)] animate-pulse" />
        <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.2_310/0.6),transparent_70%)] animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="relative text-5xl text-gold/90 animate-shimmer sm:text-6xl">✦</div>
      </div>
      <p className="min-h-[3em] max-w-md text-base leading-relaxed text-foreground/90 sm:text-lg">
        {ritualText.slice(0, visibleChars)}
        {visibleChars < ritualText.length && (
          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-gold align-middle">&nbsp;</span>
        )}
      </p>
      {showButton && (
        <button
          onClick={onNext}
          className="mt-12 animate-fade-up rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-10 py-4 text-base font-medium tracking-[0.2em] text-gold shadow-[0_0_40px_oklch(0.55_0.22_300/0.7)] transition-all hover:scale-105 animate-pulse"
        >
          {t.stepRitualBtn}
        </button>
      )}
    </section>
  );
}

/* ---------- Card back ---------- */
function CardBack() {
  return (
    <div className="relative h-full w-full rounded-xl border border-gold/40 bg-gradient-to-br from-[oklch(0.28_0.16_295)] via-[oklch(0.18_0.1_290)] to-[oklch(0.15_0.08_280)] p-2 shadow-inner">
      <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-gold/30 overflow-hidden">
        <span className="absolute left-2 top-2 text-[10px] text-gold/70 animate-twinkle">✦</span>
        <span className="absolute right-2 top-3 text-[10px] text-gold/60 animate-twinkle" style={{ animationDelay: "0.6s" }}>✶</span>
        <span className="absolute left-3 bottom-3 text-[10px] text-gold/60 animate-twinkle" style={{ animationDelay: "1.2s" }}>✦</span>
        <span className="absolute right-2 bottom-2 text-[10px] text-gold/70 animate-twinkle" style={{ animationDelay: "1.8s" }}>✶</span>
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] text-gold/40 animate-twinkle" style={{ animationDelay: "0.3s" }}>✶</span>
        <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[10px] text-gold/40 animate-twinkle" style={{ animationDelay: "2.1s" }}>✦</span>
        <div className="flex flex-col items-center gap-1 text-gold animate-shimmer">
          <div className="text-3xl sm:text-4xl">☾</div>
          <div className="text-xl sm:text-2xl">✦</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 6: Pick ---------- */
function PickStep({
  pool, picks, onPick, onConfirm, t,
}: {
  pool: DrawnCard[]; picks: number[]; onPick: (i: number) => void; onConfirm: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const done = picks.length === 3;
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      <h2 className="text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">{t.stepPickTitle}</h2>
      <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">{t.stepPickSub}</p>
      <div className="mt-6 flex h-20 items-center justify-center gap-3 sm:h-24">
        {[0, 1, 2].map((i) => {
          const idx = picks[i];
          const dc = idx !== undefined ? pool[idx] : null;
          return (
            <div key={i} className={`flex h-16 w-12 items-center justify-center rounded-md border text-[10px] tracking-widest sm:h-20 sm:w-14 ${
              dc ? "border-gold/70 bg-[oklch(0.25_0.12_295)] text-gold shadow-[0_0_15px_oklch(0.55_0.22_300/0.6)] animate-fade-up"
                : "border-dashed border-border/50 text-muted-foreground/40"
            }`}>
              {dc ? [t.positionPast, t.positionPresent, t.positionFuture][i] : i + 1}
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-5">
        {pool.map((_, i) => {
          const picked = picks.includes(i);
          return (
            <button key={i} disabled={picked || done} onClick={() => onPick(i)}
              className={`aspect-[2/3] cursor-pointer transition-all disabled:cursor-default ${
                picked ? "-translate-y-2 opacity-30" : "hover:-translate-y-1 hover:shadow-[0_0_25px_oklch(0.55_0.22_300/0.6)]"
              }`}
              aria-label={`Pick card ${i + 1}`}
            >
              <CardBack />
            </button>
          );
        })}
      </div>
      <div className="mt-10">
        {done ? (
          <PrimaryButton onClick={onConfirm}>{t.stepPickConfirm}</PrimaryButton>
        ) : (
          <p className="text-sm text-muted-foreground tracking-wider">{t.stepPickCount(picks.length)}</p>
        )}
      </div>
    </section>
  );
}

/* ---------- Step 7: Flip ---------- */
function whisperFor(card: TarotCard, reversed: boolean): string {
  return reversed ? card.reversed : card.upright;
}

function FlipStep({
  cards, flipped, onFlip, allFlipped, onContinue, error, t,
}: {
  cards: DrawnCard[]; flipped: boolean[]; onFlip: (i: number) => void;
  allFlipped: boolean; onContinue: () => void; error: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const nextIdx = flipped.findIndex((f) => !f);
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      <h2 className="text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">{t.stepFlipTitle}</h2>
      <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">{t.stepFlipSub}</p>
      <div className="mt-8 flex w-full max-w-3xl items-end justify-center gap-3 sm:gap-6">
        {cards.map((dc, i) => {
          const isNext = i === nextIdx;
          const isFlipped = flipped[i];
          return (
            <div key={i} className={`flex flex-col items-center transition-transform ${
              isNext && !isFlipped ? "scale-110" : isFlipped ? "scale-100" : "scale-90 opacity-60"
            }`}>
              <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold/80">{dc.position}</div>
              <button onClick={() => isNext && onFlip(i)} disabled={!isNext}
                className="tarot-card aspect-[2/3] w-[28vw] max-w-[170px] cursor-pointer disabled:cursor-default"
                aria-label={`Flip ${dc.position} card`}
              >
                <div className={`tarot-flip-inner ${isFlipped ? "tarot-flipped" : ""}`}>
                  <div className="tarot-face tarot-back-face"><CardBack /></div>
                  <div className="tarot-face tarot-front-face flex flex-col items-center justify-between rounded-xl border border-gold/40 bg-gradient-to-b from-[oklch(0.22_0.1_295)] to-[oklch(0.15_0.06_290)] p-3 sm:p-4">
                    <div className="text-[10px] tracking-widest text-gold/70">{String(dc.card.id).padStart(2, "0")}</div>
                    <div className={`flex flex-1 items-center justify-center text-5xl text-gold sm:text-6xl ${dc.reversed ? "rotate-180" : ""}`}>{dc.card.symbol}</div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gold sm:text-base">{dc.card.name}</div>
                      <div className="text-[10px] tracking-wider text-muted-foreground sm:text-xs">
                        {dc.card.nameEn}{dc.reversed && ` · ${t.reversed}`}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-8 min-h-[4rem] w-full max-w-xl space-y-2">
        {cards.map((dc, i) =>
          flipped[i] ? (
            <div key={i} className="animate-fade-up rounded-xl border border-gold/30 bg-card/50 px-4 py-3 backdrop-blur-xl">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold/70">{t.stepFlipWhisper} · {dc.position}</div>
              <p className="mt-1 text-sm text-foreground/90">{whisperFor(dc.card, dc.reversed)}</p>
            </div>
          ) : null
        )}
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      )}
      <div className="mt-8">
        {allFlipped ? (
          <PrimaryButton onClick={onContinue}>{t.stepFlipContinue}</PrimaryButton>
        ) : (
          <p className="text-sm text-muted-foreground tracking-wider">{t.stepFlipCount(flipped.filter(Boolean).length)}</p>
        )}
      </div>
    </section>
  );
}

/* ---------- Step 8: Interpreting ---------- */
function InterpretingStep({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
      <div className="relative mb-10 flex h-40 w-40 items-center justify-center sm:h-52 sm:w-52">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.6_0.25_305/0.6),transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 animate-spin text-gold/60" style={{ animationDuration: "6s" }}>
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-2xl">✦</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl">✶</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl">✦</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl">✶</span>
        </div>
        <div className="relative text-5xl text-gold animate-shimmer">☾</div>
      </div>
      <p className="text-base tracking-wider text-gold sm:text-lg">{t.stepInterpreting}</p>
      <p className="mt-2 text-xs text-muted-foreground">{t.stepInterpretingWait}</p>
    </section>
  );
}

/* ---------- Tiers / Reading / Modal ---------- */

function getTiers(lang: string, t: ReturnType<typeof useLanguage>["t"]) {
  const isEn = lang === "en";
  return [
    { id: "basic" as const, price: isEn ? USD_PRICES.basic : "¥29.9", name: t.tierBasic, desc: t.tierBasicDesc, highlight: false },
    { id: "deep" as const, price: isEn ? USD_PRICES.deep : "¥49.9", name: t.tierDeep, desc: t.tierDeepDesc, highlight: true },
    { id: "relationship" as const, price: isEn ? USD_PRICES.relationship : "¥128", name: t.tierRelation, desc: t.tierRelationDesc, highlight: false },
  ];
}

function ReadingScreen({
  cards, reading, unlockedTier, loading, error, onUnlock, onReset, t, lang,
}: {
  cards: DrawnCard[]; reading: string; unlockedTier: Tier | null;
  loading: boolean; error: string;
  onUnlock: (tier: Tier, partner?: string, relation?: string) => void;
  onReset: () => void;
  t: ReturnType<typeof useLanguage>["t"];
  lang: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const previewText = reading.slice(0, 200);
  const isUnlocked = unlockedTier !== null;

  return (
    <section className="flex flex-1 flex-col items-center animate-fade-up">
      <h2 className="mb-2 text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">{t.readingTitle}</h2>
      <p className="mb-8 text-center text-xs text-muted-foreground tracking-wider">
        {isUnlocked ? t.readingUnlockedHint : t.readingLockedHint}
      </p>
      <div className="w-full max-w-2xl space-y-3">
        {cards.map((c, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-[oklch(0.2_0.1_290/0.6)] text-2xl text-gold ${c.reversed ? "rotate-180" : ""}`}>
              {c.card.symbol}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold/70">{c.position}</span>
                <span className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {c.card.name}{c.reversed && `（${t.reversed}）`}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
                {c.reversed ? c.card.reversed : c.card.upright}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-6 w-full max-w-2xl">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
          {isUnlocked ? (
            <article className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-[15px] sm:leading-8">{reading}</article>
          ) : (
            <>
              <div className="mb-3 text-[10px] tracking-[0.3em] uppercase text-gold/70">{t.readingPreviewLabel}</div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85 sm:text-[15px]">
                {previewText}{reading.length > 200 && "…"}
              </p>
            </>
          )}
        </div>
        {!isUnlocked && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-b-2xl bg-gradient-to-b from-transparent via-background/70 to-background" />
            <div className="absolute inset-x-0 bottom-6 flex justify-center">
              <button onClick={() => setShowModal(true)}
                className="pointer-events-auto rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-7 py-3.5 text-sm font-medium tracking-[0.2em] text-gold shadow-[0_0_40px_oklch(0.55_0.22_300/0.7)] transition-all hover:scale-105 sm:px-10 sm:py-4 sm:text-base"
              >
                {t.readingUnlockBtn}
              </button>
            </div>
          </>
        )}
      </div>
      {loading && (
        <div className="mt-6 flex items-center gap-3 rounded-full border border-gold/30 bg-card/60 px-5 py-2.5 text-sm text-gold backdrop-blur-xl">
          <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          {t.readingLoading}
        </div>
      )}
      {error && !loading && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      )}
      <button onClick={onReset}
        className="mt-10 inline-flex items-center gap-1 rounded-full border border-border/60 px-5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" /> {t.readingReset}
      </button>
      {showModal && (
        <UnlockModal
          loading={loading}
          onClose={() => setShowModal(false)}
          onUnlock={(tier, partner, relation) => { setShowModal(false); onUnlock(tier, partner, relation); }}
          t={t}
          lang={lang}
        />
      )}
    </section>
  );
}

function UnlockModal({
  loading, onClose, onUnlock, t, lang,
}: {
  loading: boolean; onClose: () => void;
  onUnlock: (tier: Tier, partner?: string, relation?: string) => void;
  t: ReturnType<typeof useLanguage>["t"];
  lang: string;
}) {
  const [pickingRelationship, setPickingRelationship] = useState(false);
  const [partner, setPartner] = useState("");
  const [relation, setRelation] = useState("");
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const isEn = lang === "en";
  const tiers = getTiers(lang, t);

  const handleRedeem = () => {
    setCodeMsg(null);
    const result = redeemCode(code);
    if (!result.ok) {
      setCodeMsg({ kind: "err", text: result.reason === "used" ? t.unlockCodeUsed : t.unlockCodeInvalid });
      return;
    }
    setCodeMsg({ kind: "ok", text: t.unlockCodeSuccess(TIER_LABEL[result.tier]) });
    if (result.tier === "relationship") {
      setPickingRelationship(true);
    } else {
      onUnlock(result.tier);
    }
  };

  const handleLemonSqueezy = (tier: string) => {
    const link = LEMON_SQUEEZY_LINKS[tier];
    if (!link || link.includes("YOUR_STORE")) {
      alert("Payment links are not configured yet. Please set up Lemon Squeezy products first.");
      return;
    }
    window.open(link, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/30 bg-[oklch(0.15_0.06_295)] p-6 shadow-[0_0_60px_oklch(0.55_0.22_300/0.5)] sm:p-8"
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground" aria-label={t.close}>
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-center text-xl font-semibold tracking-wider text-gold sm:text-2xl">{t.unlockTitle}</h3>
        <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">
          {pickingRelationship ? t.unlockRelationshipTitle : t.unlockSub}
        </p>

        {!pickingRelationship && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tiers.map((tier) => (
              <button key={tier.id} disabled={loading}
                onClick={() => {
                  if (tier.id === "relationship") { setPickingRelationship(true); }
                  else if (isEn) { handleLemonSqueezy(tier.id); }
                  else { onUnlock(tier.id); }
                }}
                className={`relative rounded-xl border p-4 text-left transition-all hover:scale-[1.02] disabled:opacity-50 ${
                  tier.highlight
                    ? "border-gold/60 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.6)] to-[oklch(0.2_0.1_290/0.4)] shadow-[0_0_30px_oklch(0.55_0.22_300/0.3)]"
                    : "border-border/60 bg-card/40 hover:border-gold/40"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-[oklch(0.18_0.05_290)]">
                    {t.unlockRecommended}
                  </div>
                )}
                <div className="text-2xl font-bold text-foreground">{tier.price}</div>
                <div className="mt-1 text-sm tracking-wider text-gold">{tier.name}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tier.desc}</p>
                {isEn && (
                  <div className="mt-2 text-[10px] text-gold/60">{t.lemonSqueezyLabel}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {pickingRelationship && (
          <div className="mt-6 space-y-4 rounded-xl border border-gold/30 bg-card/40 p-4 sm:p-5">
            <div>
              <label className="mb-1.5 block text-xs tracking-[0.3em] uppercase text-gold">{t.unlockPartnerLabel}</label>
              <input value={partner} onChange={(e) => setPartner(e.target.value)}
                placeholder={t.unlockPartnerPlaceholder}
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                maxLength={50}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs tracking-[0.3em] uppercase text-gold">{t.unlockRelationLabel}</label>
              <input value={relation} onChange={(e) => setRelation(e.target.value)}
                placeholder={t.unlockRelationPlaceholder}
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                maxLength={50}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setPickingRelationship(false)} className="text-xs text-muted-foreground hover:text-foreground">
                {t.unlockBackToTiers}
              </button>
              <button
                disabled={loading || !partner.trim() || !relation.trim()}
                onClick={() => isEn ? handleLemonSqueezy("relationship") : onUnlock("relationship", partner.trim(), relation.trim())}
                className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-5 py-2 text-xs font-medium tracking-[0.2em] text-gold disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {t.unlockGenerate}
              </button>
            </div>
          </div>
        )}

        {/* WeChat QR - only for Chinese users */}
        {!isEn && (
          <div className="mt-7 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-gold tracking-wider">{t.unlockWechatHint}</p>
            <div className="rounded-xl border border-gold/40 bg-white p-3">
              <img src={wechatQr.url} alt="WeChat QR" className="h-44 w-44 object-contain sm:h-52 sm:w-52" />
            </div>
            <p className="text-xs text-muted-foreground">微信号：<span className="font-mono text-gold">Why08248888W</span></p>
          </div>
        )}

        {/* Lemon Squeezy hint - for English users */}
        {isEn && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">{t.lemonSqueezyHint}</p>
          </div>
        )}

        {!isEn && (
          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/80">{t.unlockWechatNote}</p>
        )}

        {/* Unlock code section */}
        <div className="mt-6 rounded-xl border border-gold/30 bg-card/40 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-gold">
            <KeyRound className="h-3.5 w-3.5" /> {t.unlockCodeLabel}
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">{t.unlockCodeHint}</p>
          <div className="flex gap-2">
            <input value={code}
              onChange={(e) => { setCode(e.target.value); setCodeMsg(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              placeholder={t.unlockCodePlaceholder}
              className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
              maxLength={20}
            />
            <button onClick={handleRedeem} disabled={loading || !code.trim()}
              className="rounded-lg border border-gold/60 bg-gradient-to-r from-[oklch(0.3_0.15_295)] to-[oklch(0.35_0.18_280)] px-4 py-2.5 text-sm font-medium tracking-wider text-gold transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.unlockCodeBtn}
            </button>
          </div>
          {codeMsg && (
            <p className={`mt-2 flex items-center gap-1 text-xs ${codeMsg.kind === "ok" ? "text-gold" : "text-destructive"}`}>
              {codeMsg.kind === "ok" && <Check className="h-3.5 w-3.5" />}{codeMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  return (
    <footer className="relative z-10 mt-16 border-t border-border/30 pt-8 text-center text-xs text-muted-foreground">
      <div className="mb-2 flex items-center justify-center gap-2 text-gold/70">
        <span>✦</span>
        <span className="tracking-[0.3em]">{t.footerContact}</span>
        <span>✦</span>
      </div>
      <p>{t.footerWechat} <span className="ml-1 font-mono text-gold">Why08248888W</span></p>
      <p className="mt-2 opacity-60">{t.footerDisclaimer.replace("{year}", String(new Date().getFullYear()))}</p>
      <p className="mt-1 text-[10px] text-muted-foreground/50">{t.footerCodeHint}</p>
    </footer>
  );
}

function SecretCodeList({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  const [clicks, setClicks] = useState(0);
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState<string[]>([]);

  const handleDot = () => {
    const next = clicks + 1;
    if (next >= 5) { setUsed(loadUsedPresets()); setOpen(true); setClicks(0); }
    else { setClicks(next); setTimeout(() => setClicks((c) => (c === next ? 0 : c)), 2000); }
  };

  const totalCodes = PRESET_GROUPS.reduce((s, g) => s + g.codes.length, 0);

  return (
    <>
      <button onClick={handleDot} aria-label="."
        className="fixed bottom-2 right-2 z-40 h-3 w-3 rounded-full text-[10px] leading-none text-muted-foreground/20 hover:text-muted-foreground/40"
      >.</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm animate-fade-up" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gold/30 bg-[oklch(0.15_0.06_295)] p-6 shadow-[0_0_60px_oklch(0.55_0.22_300/0.5)] sm:p-8"
          >
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground" aria-label={t.secretClose}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-center text-lg font-semibold tracking-wider text-gold sm:text-xl">{t.secretTitle}</h3>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">{t.secretTotal(totalCodes, used.length)}</p>
            <div className="mt-5 space-y-5">
              {PRESET_GROUPS.map((g) => (
                <div key={g.tier} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wider text-gold">{TIER_LABEL[g.tier]}</div>
                    <div className="text-[11px] text-muted-foreground">{g.codes.length}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.codes.map((c) => {
                      const isUsed = used.includes(c);
                      return (
                        <div key={c} className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 font-mono text-xs ${
                          isUsed ? "border-border/40 bg-background/20 text-muted-foreground/50 line-through" : "border-gold/30 bg-background/40 text-foreground"
                        }`}>
                          <span className="truncate">{c}</span>
                          <span className={`ml-2 shrink-0 text-[9px] tracking-wider ${isUsed ? "text-muted-foreground/50" : "text-gold/70"}`}>
                            {isUsed ? t.secretUsed : t.secretUnused}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
