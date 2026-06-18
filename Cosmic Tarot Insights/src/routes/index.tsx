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
} from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { MAJOR_ARCANA, type DrawnCard, type TarotCard } from "@/lib/tarot";
import { getTarotReading } from "@/lib/reading.functions";
import { redeemCode, loadMyCode, TIER_LABEL } from "@/lib/unlock-codes";
import { PRESET_GROUPS, loadUsedPresets } from "@/lib/unlock-codes";
import wechatQr from "@/assets/wechat-qr.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI 塔罗占卜 · 让宇宙给你答案" },
      { name: "description", content: "默念你的问题，AI 塔罗为你揭示宇宙的指引。" },
      { property: "og:title", content: "AI 塔罗占卜" },
      { property: "og:description", content: "默念你的问题，让宇宙给你答案。" },
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

const TOPICS = [
  { id: "love", emoji: "💕", label: "感情" },
  { id: "career", emoji: "💼", label: "事业" },
  { id: "wealth", emoji: "💰", label: "财运" },
  { id: "health", emoji: "🌿", label: "健康" },
  { id: "family", emoji: "🏠", label: "家庭" },
  { id: "other", emoji: "✨", label: "其他" },
] as const;

const MOODS = [
  { emoji: "😰", label: "焦虑" },
  { emoji: "🤔", label: "迷茫" },
  { emoji: "😌", label: "平静" },
  { emoji: "💔", label: "伤心" },
  { emoji: "🔥", label: "期待" },
  { emoji: "😶", label: "说不清" },
] as const;

function buildPool(): DrawnCard[] {
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5).slice(0, 6);
  return shuffled.map((card) => ({
    card,
    reversed: Math.random() < 0.4,
    position: "过去" as const,
  }));
}

function Index() {
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
    const positions: DrawnCard["position"][] = ["过去", "现在", "未来"];
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
      name: `${c.card.name}${c.reversed ? "（逆位）" : "（正位）"}`,
      position: c.position,
      reversed: c.reversed,
      keywords: c.card.keywords,
    }));

  const buildQuestion = () => {
    const topicLabel = TOPICS.find((t) => t.id === topic)?.label ?? "";
    return [
      name && `我叫${name}`,
      topicLabel && `关于${topicLabel}`,
      question.trim() || "（凭直觉感应）",
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
      setError(e instanceof Error ? e.message : "宇宙信号暂时中断，请稍后再试 ✨");
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
        },
      });
      setReading(res.reading);
      setUnlockedTier(tier);
    } catch (e) {
      setError(e instanceof Error ? e.message : "宇宙信号暂时中断，请稍后再试 ✨");
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Starfield />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.22_300/0.25),transparent_60%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-10 sm:px-8 sm:py-16">
        {step === "name" && (
          <NameStep name={name} setName={setName} onNext={() => setStep("topic")} />
        )}
        {step === "topic" && (
          <TopicStep
            topic={topic}
            setTopic={setTopic}
            onBack={() => setStep("name")}
            onNext={() => setStep("question")}
          />
        )}
        {step === "question" && (
          <QuestionStep
            question={question}
            setQuestion={setQuestion}
            onBack={() => setStep("topic")}
            onNext={() => setStep("mood")}
          />
        )}
        {step === "mood" && (
          <MoodStep
            mood={mood}
            setMood={setMood}
            onBack={() => setStep("question")}
            onNext={startRitual}
          />
        )}
        {step === "ritual" && <RitualStep onNext={() => setStep("pick")} />}
        {step === "pick" && (
          <PickStep
            pool={pool}
            picks={picks}
            onPick={togglePick}
            onConfirm={confirmPicks}
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
          />
        )}
        {step === "interpreting" && <InterpretingStep />}
        {step === "reading" && (
          <ReadingScreen
            cards={cards}
            reading={reading}
            unlockedTier={unlockedTier}
            loading={loading}
            error={error}
            onUnlock={unlockTier}
            onReset={reset}
          />
        )}

        <Footer />
      </main>
      <SecretCodeList />
    </div>
  );
}

/* ---------- Step shells ---------- */

function StepShell({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> 返回
        </button>
      )}
      <div className="mb-2 flex items-center gap-2 text-gold/80">
        <Moon className="h-4 w-4" />
        <span className="text-[10px] tracking-[0.4em] uppercase">灵犀</span>
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
  name,
  setName,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <StepShell title="我是灵犀，你叫什么？">
      <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
          placeholder="输入你的名字或昵称"
          className="w-full rounded-lg border border-border bg-background/40 px-4 py-3.5 text-center text-base text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
          maxLength={30}
        />
        <div className="flex justify-center">
          <PrimaryButton disabled={!name.trim()} onClick={onNext}>
            继续 →
          </PrimaryButton>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
        名字让你的能量与牌面共振
      </p>
    </StepShell>
  );
}

/* ---------- Step 2: Topic ---------- */
function TopicStep({
  topic,
  setTopic,
  onBack,
  onNext,
}: {
  topic: string;
  setTopic: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell title="你想问什么？" onBack={onBack}>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {TOPICS.map((t) => {
          const active = topic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.03] sm:p-5 ${
                active
                  ? "border-gold/70 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.7)] to-[oklch(0.2_0.1_290/0.4)] shadow-[0_0_25px_oklch(0.55_0.22_300/0.5)]"
                  : "border-border/60 bg-card/40 hover:border-gold/40"
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${
                  active ? "bg-gold/20 ring-2 ring-gold/60" : "bg-background/50"
                }`}
              >
                {t.emoji}
              </div>
              <div
                className={`text-sm tracking-wider ${
                  active ? "text-gold" : "text-foreground/80"
                }`}
              >
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        <PrimaryButton disabled={!topic} onClick={onNext}>
          继续 →
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

/* ---------- Step 3: Question ---------- */
function QuestionStep({
  question,
  setQuestion,
  onBack,
  onNext,
}: {
  question: string;
  setQuestion: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell title="告诉我更多" subtitle="写得越具体，解读越准" onBack={onBack}>
      <div className="space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl sm:p-8">
        <textarea
          autoFocus
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="比如：我该不该接受这份新工作？我和ta接下来三个月会怎样？"
          rows={5}
          className="w-full resize-none rounded-lg border border-border bg-background/40 px-4 py-3 text-sm leading-7 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
          maxLength={500}
        />
        <div className="flex justify-center">
          <PrimaryButton disabled={!question.trim()} onClick={onNext}>
            继续 →
          </PrimaryButton>
        </div>
      </div>
    </StepShell>
  );
}

/* ---------- Step 4: Mood ---------- */
function MoodStep({
  mood,
  setMood,
  onBack,
  onNext,
}: {
  mood: string;
  setMood: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell title="此刻你感觉如何？" onBack={onBack}>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {MOODS.map((m) => {
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
              <div
                className={`text-sm tracking-wider ${
                  active ? "text-gold" : "text-foreground/80"
                }`}
              >
                {m.label}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        <PrimaryButton disabled={!mood} onClick={onNext}>
          <Sparkles className="h-4 w-4" /> 开始占卜 →
        </PrimaryButton>
      </div>
    </StepShell>
  );
}

/* ---------- Step 5: Ritual ---------- */
const RITUAL_TEXT =
  "闭上眼睛...深呼吸三次...在你的心里默念你的问题...灵犀正在连接你的能量场...";

function RitualStep({ onNext }: { onNext: () => void }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChars((c) => {
        if (c >= RITUAL_TEXT.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 110);
    const t = setTimeout(() => setShowButton(true), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, []);

  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
      <div className="relative mb-12 flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.25_300/0.7),oklch(0.3_0.2_290/0.3)_60%,transparent_75%)] animate-pulse" />
        <div
          className="absolute inset-6 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.2_310/0.6),transparent_70%)] animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <div className="relative text-5xl text-gold/90 animate-shimmer sm:text-6xl">✦</div>
      </div>
      <p className="min-h-[3em] max-w-md text-base leading-relaxed text-foreground/90 sm:text-lg">
        {RITUAL_TEXT.slice(0, visibleChars)}
        {visibleChars < RITUAL_TEXT.length && (
          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-gold align-middle">&nbsp;</span>
        )}
      </p>
      {showButton && (
        <button
          onClick={onNext}
          className="mt-12 animate-fade-up rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-10 py-4 text-base font-medium tracking-[0.2em] text-gold shadow-[0_0_40px_oklch(0.55_0.22_300/0.7)] transition-all hover:scale-105 animate-pulse"
        >
          ✨ 感应到了，开始抽牌
        </button>
      )}
    </section>
  );
}

/* ---------- Card back (reused) ---------- */
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
  pool,
  picks,
  onPick,
  onConfirm,
}: {
  pool: DrawnCard[];
  picks: number[];
  onPick: (i: number) => void;
  onConfirm: () => void;
}) {
  const done = picks.length === 3;
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      <h2 className="text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">
        用你的直觉，选出 3 张牌
      </h2>
      <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">
        选了之后不能改 · 跟随直觉
      </p>

      {/* Selected indicators */}
      <div className="mt-6 flex h-20 items-center justify-center gap-3 sm:h-24">
        {[0, 1, 2].map((i) => {
          const idx = picks[i];
          const dc = idx !== undefined ? pool[idx] : null;
          return (
            <div
              key={i}
              className={`flex h-16 w-12 items-center justify-center rounded-md border text-[10px] tracking-widest sm:h-20 sm:w-14 ${
                dc
                  ? "border-gold/70 bg-[oklch(0.25_0.12_295)] text-gold shadow-[0_0_15px_oklch(0.55_0.22_300/0.6)] animate-fade-up"
                  : "border-dashed border-border/50 text-muted-foreground/40"
              }`}
            >
              {dc ? ["过去", "现在", "未来"][i] : i + 1}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-5">
        {pool.map((_, i) => {
          const picked = picks.includes(i);
          return (
            <button
              key={i}
              disabled={picked || done}
              onClick={() => onPick(i)}
              className={`aspect-[2/3] cursor-pointer transition-all disabled:cursor-default ${
                picked
                  ? "-translate-y-2 opacity-30"
                  : "hover:-translate-y-1 hover:shadow-[0_0_25px_oklch(0.55_0.22_300/0.6)]"
              }`}
              aria-label={`选第 ${i + 1} 张牌`}
            >
              <CardBack />
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        {done ? (
          <PrimaryButton onClick={onConfirm}>🔮 翻开命运之牌</PrimaryButton>
        ) : (
          <p className="text-sm text-muted-foreground tracking-wider">
            已选 {picks.length} / 3
          </p>
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
  cards,
  flipped,
  onFlip,
  allFlipped,
  onContinue,
  error,
}: {
  cards: DrawnCard[];
  flipped: boolean[];
  onFlip: (i: number) => void;
  allFlipped: boolean;
  onContinue: () => void;
  error: string;
}) {
  const nextIdx = flipped.findIndex((f) => !f);
  return (
    <section className="flex flex-1 flex-col items-center justify-center animate-fade-up">
      <h2 className="text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">
        依次翻开你的牌
      </h2>
      <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">
        点一下翻一张 · 倾听灵犀的低语
      </p>

      <div className="mt-8 flex w-full max-w-3xl items-end justify-center gap-3 sm:gap-6">
        {cards.map((dc, i) => {
          const isNext = i === nextIdx;
          const isFlipped = flipped[i];
          return (
            <div
              key={i}
              className={`flex flex-col items-center transition-transform ${
                isNext && !isFlipped
                  ? "scale-110"
                  : isFlipped
                  ? "scale-100"
                  : "scale-90 opacity-60"
              }`}
            >
              <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold/80">
                {dc.position}
              </div>
              <button
                onClick={() => isNext && onFlip(i)}
                disabled={!isNext}
                className="tarot-card aspect-[2/3] w-[28vw] max-w-[170px] cursor-pointer disabled:cursor-default"
                aria-label={`翻开${dc.position}的牌`}
              >
                <div className={`tarot-flip-inner ${isFlipped ? "tarot-flipped" : ""}`}>
                  <div className="tarot-face tarot-back-face">
                    <CardBack />
                  </div>
                  <div className="tarot-face tarot-front-face flex flex-col items-center justify-between rounded-xl border border-gold/40 bg-gradient-to-b from-[oklch(0.22_0.1_295)] to-[oklch(0.15_0.06_290)] p-3 sm:p-4">
                    <div className="text-[10px] tracking-widest text-gold/70">
                      {String(dc.card.id).padStart(2, "0")}
                    </div>
                    <div
                      className={`flex flex-1 items-center justify-center text-5xl text-gold sm:text-6xl ${
                        dc.reversed ? "rotate-180" : ""
                      }`}
                    >
                      {dc.card.symbol}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gold sm:text-base">
                        {dc.card.name}
                      </div>
                      <div className="text-[10px] tracking-wider text-muted-foreground sm:text-xs">
                        {dc.card.nameEn}
                        {dc.reversed && " · 逆位"}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Whisper feed */}
      <div className="mt-8 min-h-[4rem] w-full max-w-xl space-y-2">
        {cards.map((dc, i) =>
          flipped[i] ? (
            <div
              key={i}
              className="animate-fade-up rounded-xl border border-gold/30 bg-card/50 px-4 py-3 backdrop-blur-xl"
            >
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold/70">
                灵犀低语 · {dc.position}
              </div>
              <p className="mt-1 text-sm text-foreground/90">
                {whisperFor(dc.card, dc.reversed)}
              </p>
            </div>
          ) : null
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-8">
        {allFlipped ? (
          <PrimaryButton onClick={onContinue}>✨ 查看完整解读</PrimaryButton>
        ) : (
          <p className="text-sm text-muted-foreground tracking-wider">
            {flipped.filter(Boolean).length} / 3 已翻开
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- Step 8: Interpreting ---------- */
function InterpretingStep() {
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
      <p className="text-base tracking-wider text-gold sm:text-lg">
        灵犀正在解读这张牌与你的命运共振…
      </p>
      <p className="mt-2 text-xs text-muted-foreground">请稍候</p>
    </section>
  );
}

/* ---------- Tiers / Reading / Modal / Footer / Secret list ---------- */

const TIERS = [
  {
    id: "basic" as const,
    price: "¥29.9",
    name: "基础解读",
    desc: "完整三张牌解析（约 800 字）",
    highlight: false,
  },
  {
    id: "deep" as const,
    price: "¥49.9",
    name: "深度解读",
    desc: "深度解析 + 行动建议（约 2000 字）",
    highlight: true,
  },
  {
    id: "relationship" as const,
    price: "¥128",
    name: "关系合盘",
    desc: "两人关系深度分析报告",
    highlight: false,
  },
];

function ReadingScreen({
  cards,
  reading,
  unlockedTier,
  loading,
  error,
  onUnlock,
  onReset,
}: {
  cards: DrawnCard[];
  reading: string;
  unlockedTier: Tier | null;
  loading: boolean;
  error: string;
  onUnlock: (tier: Tier, partner?: string, relation?: string) => void;
  onReset: () => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const previewText = reading.slice(0, 200);
  const isUnlocked = unlockedTier !== null;

  return (
    <section className="flex flex-1 flex-col items-center animate-fade-up">
      <h2 className="mb-2 text-center text-2xl font-semibold tracking-wider text-gold sm:text-3xl">
        宇宙的回响
      </h2>
      <p className="mb-8 text-center text-xs text-muted-foreground tracking-wider">
        {isUnlocked ? "完整解读已为你呈现" : "三张牌已为你揭示初步指引"}
      </p>

      <div className="w-full max-w-2xl space-y-3">
        {cards.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-[oklch(0.2_0.1_290/0.6)] text-2xl text-gold ${c.reversed ? "rotate-180" : ""}`}>
              {c.card.symbol}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold/70">{c.position}</span>
                <span className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {c.card.name}{c.reversed && "（逆位）"}
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
            <article className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-[15px] sm:leading-8">
              {reading}
            </article>
          ) : (
            <>
              <div className="mb-3 text-[10px] tracking-[0.3em] uppercase text-gold/70">
                灵犀的初探 · 摘要
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85 sm:text-[15px]">
                {previewText}
                {reading.length > 200 && "…"}
              </p>
            </>
          )}
        </div>

        {!isUnlocked && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-b-2xl bg-gradient-to-b from-transparent via-background/70 to-background" />
            <div className="absolute inset-x-0 bottom-6 flex justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="pointer-events-auto rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-7 py-3.5 text-sm font-medium tracking-[0.2em] text-gold shadow-[0_0_40px_oklch(0.55_0.22_300/0.7)] transition-all hover:scale-105 sm:px-10 sm:py-4 sm:text-base"
              >
                ✨ 解锁完整解读
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
          灵犀正在为你感应塔罗的能量…
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-10 inline-flex items-center gap-1 rounded-full border border-border/60 px-5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" /> 再占一次
      </button>

      {showModal && (
        <UnlockModal
          loading={loading}
          onClose={() => setShowModal(false)}
          onUnlock={(tier, partner, relation) => {
            setShowModal(false);
            onUnlock(tier, partner, relation);
          }}
        />
      )}
    </section>
  );
}

function UnlockModal({
  loading,
  onClose,
  onUnlock,
}: {
  loading: boolean;
  onClose: () => void;
  onUnlock: (tier: Tier, partner?: string, relation?: string) => void;
}) {
  const [pickingRelationship, setPickingRelationship] = useState(false);
  const [partner, setPartner] = useState("");
  const [relation, setRelation] = useState("");
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleRedeem = () => {
    setCodeMsg(null);
    const result = redeemCode(code);
    if (!result.ok) {
      setCodeMsg({
        kind: "err",
        text: result.reason === "used" ? "该解锁码已被使用" : "解锁码无效，请检查后重试",
      });
      return;
    }
    setCodeMsg({ kind: "ok", text: `验证成功 · ${TIER_LABEL[result.tier]}` });
    if (result.tier === "relationship") {
      setPickingRelationship(true);
    } else {
      onUnlock(result.tier);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/30 bg-[oklch(0.15_0.06_295)] p-6 shadow-[0_0_60px_oklch(0.55_0.22_300/0.5)] sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-center text-xl font-semibold tracking-wider text-gold sm:text-2xl">
          获取完整解读报告
        </h3>
        <p className="mt-2 text-center text-xs text-muted-foreground tracking-wider">
          {pickingRelationship ? "请补充对方信息" : "选择适合你的解读档位"}
        </p>

        {!pickingRelationship && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TIERS.map((t) => (
              <button
                key={t.id}
                disabled={loading}
                onClick={() => {
                  if (t.id === "relationship") {
                    setPickingRelationship(true);
                  } else {
                    onUnlock(t.id);
                  }
                }}
                className={`relative rounded-xl border p-4 text-left transition-all hover:scale-[1.02] disabled:opacity-50 ${
                  t.highlight
                    ? "border-gold/60 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.6)] to-[oklch(0.2_0.1_290/0.4)] shadow-[0_0_30px_oklch(0.55_0.22_300/0.3)]"
                    : "border-border/60 bg-card/40 hover:border-gold/40"
                }`}
              >
                {t.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-[oklch(0.18_0.05_290)]">
                    🔥 推荐
                  </div>
                )}
                <div className="text-2xl font-bold text-foreground">{t.price}</div>
                <div className="mt-1 text-sm tracking-wider text-gold">{t.name}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {pickingRelationship && (
          <div className="mt-6 space-y-4 rounded-xl border border-gold/30 bg-card/40 p-4 sm:p-5">
            <div>
              <label className="mb-1.5 block text-xs tracking-[0.3em] uppercase text-gold">
                对方名字 / 昵称
              </label>
              <input
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="例如：小M"
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                maxLength={50}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs tracking-[0.3em] uppercase text-gold">
                你们的关系
              </label>
              <input
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="例如：暧昧 / 恋爱 / 分手 / 暗恋"
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
                maxLength={50}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setPickingRelationship(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← 返回选档位
              </button>
              <button
                disabled={loading || !partner.trim() || !relation.trim()}
                onClick={() => onUnlock("relationship", partner.trim(), relation.trim())}
                className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.35_0.18_295)] to-[oklch(0.4_0.2_280)] px-5 py-2 text-xs font-medium tracking-[0.2em] text-gold disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                生成合盘
              </button>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gold tracking-wider">扫码加微信购买 →</p>
          <div className="rounded-xl border border-gold/40 bg-white p-3">
            <img
              src={wechatQr.url}
              alt="微信二维码"
              className="h-44 w-44 object-contain sm:h-52 sm:w-52"
            />
          </div>
          <p className="text-xs text-muted-foreground">微信号：<span className="font-mono text-gold">Why08248888W</span></p>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          付款后截图发微信，5 分钟内发送完整报告
        </p>

        <div className="mt-6 rounded-xl border border-gold/30 bg-card/40 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-gold">
            <KeyRound className="h-3.5 w-3.5" /> 输入解锁码
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            付款后微信会发给你解锁码
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeMsg(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              placeholder="LINGXI-XXX"
              className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
              maxLength={20}
            />
            <button
              onClick={handleRedeem}
              disabled={loading || !code.trim()}
              className="rounded-lg border border-gold/60 bg-gradient-to-r from-[oklch(0.3_0.15_295)] to-[oklch(0.35_0.18_280)] px-4 py-2.5 text-sm font-medium tracking-wider text-gold transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "解锁"}
            </button>
          </div>
          {codeMsg && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                codeMsg.kind === "ok" ? "text-gold" : "text-destructive"
              }`}
            >
              {codeMsg.kind === "ok" && <Check className="h-3.5 w-3.5" />}
              {codeMsg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-border/30 pt-8 text-center text-xs text-muted-foreground">
      <div className="mb-2 flex items-center justify-center gap-2 text-gold/70">
        <span>✦</span>
        <span className="tracking-[0.3em]">CONTACT</span>
        <span>✦</span>
      </div>
      <p>
        如需深度咨询或定制占卜，请添加微信：
        <span className="ml-1 font-mono text-gold">Why08248888W</span>
      </p>
      <p className="mt-2 opacity-60">© {new Date().getFullYear()} AI 塔罗占卜 · 仅供娱乐参考</p>
      <p className="mt-1 text-[10px] text-muted-foreground/50">
        解锁码为一次性使用，仅限本人查阅
      </p>
    </footer>
  );
}

function SecretCodeList() {
  const [clicks, setClicks] = useState(0);
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState<string[]>([]);

  const handleDot = () => {
    const next = clicks + 1;
    if (next >= 5) {
      setUsed(loadUsedPresets());
      setOpen(true);
      setClicks(0);
    } else {
      setClicks(next);
      setTimeout(() => setClicks((c) => (c === next ? 0 : c)), 2000);
    }
  };

  return (
    <>
      <button
        onClick={handleDot}
        aria-label="."
        className="fixed bottom-2 right-2 z-40 h-3 w-3 rounded-full text-[10px] leading-none text-muted-foreground/20 hover:text-muted-foreground/40"
      >
        .
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm animate-fade-up"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gold/30 bg-[oklch(0.15_0.06_295)] p-6 shadow-[0_0_60px_oklch(0.55_0.22_300/0.5)] sm:p-8"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-center text-lg font-semibold tracking-wider text-gold sm:text-xl">
              预设解锁码列表
            </h3>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              共 {PRESET_GROUPS.reduce((s, g) => s + g.codes.length, 0)} 个 · 已使用 {used.length} 个
            </p>

            <div className="mt-5 space-y-5">
              {PRESET_GROUPS.map((g) => (
                <div key={g.tier} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wider text-gold">
                      {TIER_LABEL[g.tier]}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {g.codes.length} 个
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.codes.map((c) => {
                      const isUsed = used.includes(c);
                      return (
                        <div
                          key={c}
                          className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 font-mono text-xs ${
                            isUsed
                              ? "border-border/40 bg-background/20 text-muted-foreground/50 line-through"
                              : "border-gold/30 bg-background/40 text-foreground"
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          <span className={`ml-2 shrink-0 text-[9px] tracking-wider ${isUsed ? "text-muted-foreground/50" : "text-gold/70"}`}>
                            {isUsed ? "已用" : "未用"}
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
