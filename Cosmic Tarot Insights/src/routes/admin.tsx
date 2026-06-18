import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Copy, Check, Sparkles } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import {
  ADMIN_PASSWORD,
  TIER_LABEL,
  formatTime,
  generateCode,
  loadAdminAuth,
  loadCodes,
  setAdminAuth,
  type CodeTier,
  type UnlockCode,
} from "@/lib/unlock-codes";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "灵犀 · 管理后台" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(loadAdminAuth());
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Starfield />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.22_300/0.25),transparent_60%)]" />
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        {authed ? (
          <Dashboard onLogout={() => { setAdminAuth(false); setAuthed(false); }} />
        ) : (
          <Login onOk={() => { setAdminAuth(true); setAuthed(true); }} />
        )}
      </main>
    </div>
  );
}

function Login({ onOk }: { onOk: () => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (pwd === ADMIN_PASSWORD) {
      onOk();
    } else {
      setErr("密码错误");
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-xl">
      <div className="mb-6 flex flex-col items-center gap-2 text-gold">
        <Lock className="h-6 w-6" />
        <h1 className="text-lg font-semibold tracking-[0.3em]">管理后台</h1>
      </div>
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="请输入管理密码"
        className="w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      <button
        onClick={submit}
        className="mt-4 w-full rounded-full border border-gold/60 bg-gradient-to-r from-[oklch(0.3_0.15_295)] to-[oklch(0.35_0.18_280)] py-3 text-sm tracking-[0.3em] text-gold transition-all hover:scale-[1.02]"
      >
        进 入
      </button>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [codes, setCodes] = useState<UnlockCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>("");

  useEffect(() => {
    setCodes(loadCodes());
    const onStorage = () => setCodes(loadCodes());
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setCodes(loadCodes()), 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  const handleGenerate = (tier: CodeTier) => {
    const item = generateCode(tier);
    setCodes(loadCodes());
    void copyToClipboard(item.code);
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 1500);
    } catch {
      // ignore
    }
  };

  const TIER_BTNS: Array<{ tier: CodeTier; label: string }> = [
    { tier: "basic", label: "生成 ¥29.9 基础码" },
    { tier: "deep", label: "生成 ¥49.9 深度码" },
    { tier: "relationship", label: "生成 ¥128 合盘码" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-wider text-gold sm:text-3xl">灵犀 · 解锁码管理</h1>
          <p className="mt-1 text-xs text-muted-foreground">共 {codes.length} 张 · 已使用 {codes.filter((c) => c.used).length}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full border border-border/60 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          退出
        </button>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl sm:p-6">
        <div className="mb-3 text-xs tracking-[0.3em] uppercase text-gold">生成解锁码</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TIER_BTNS.map((b) => (
            <button
              key={b.tier}
              onClick={() => handleGenerate(b.tier)}
              className="rounded-xl border border-gold/40 bg-gradient-to-b from-[oklch(0.3_0.15_295/0.4)] to-[oklch(0.2_0.1_290/0.3)] px-4 py-4 text-sm font-medium text-gold transition-all hover:scale-[1.02] hover:border-gold/70"
            >
              <Sparkles className="mr-1 inline h-4 w-4" />
              {b.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="border-b border-border/40 px-5 py-3 text-xs tracking-[0.3em] uppercase text-gold sm:px-6">
          解锁码列表
        </div>
        {codes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            还没有生成任何解锁码
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {codes.map((c) => (
              <li
                key={c.code}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[2fr_1fr_1.4fr_auto] sm:px-6"
              >
                <button
                  onClick={() => copyToClipboard(c.code)}
                  title="点击复制"
                  className={`flex items-center gap-2 text-left font-mono text-sm transition-colors ${
                    c.used ? "text-muted-foreground line-through" : "text-foreground hover:text-gold"
                  }`}
                >
                  {c.code}
                  {copiedCode === c.code ? (
                    <Check className="h-3.5 w-3.5 text-gold" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 opacity-50" />
                  )}
                </button>
                <span className={`hidden text-xs sm:inline ${c.used ? "text-muted-foreground" : "text-gold/80"}`}>
                  {TIER_LABEL[c.tier]}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {formatTime(c.createdAt)}
                </span>
                <span
                  className={`justify-self-end rounded-full px-2.5 py-0.5 text-[10px] tracking-widest ${
                    c.used
                      ? "border border-border/40 text-muted-foreground"
                      : "border border-gold/50 text-gold"
                  }`}
                >
                  {c.used ? "已使用" : "未使用"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}