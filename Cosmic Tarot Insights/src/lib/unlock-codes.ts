export type CodeTier = "basic" | "deep" | "relationship";

export type UnlockCode = {
  code: string;
  tier: CodeTier;
  createdAt: number;
  used: boolean;
  usedAt?: number;
};

const CODES_KEY = "lingxi:codes";
const MY_CODE_KEY = "lingxi:my-code";
const ADMIN_AUTH_KEY = "lingxi:admin-auth";
const USED_PRESETS_KEY = "lingxi:used-presets";

export const ADMIN_PASSWORD = "lingxi2024";

export const TIER_LABEL: Record<CodeTier, string> = {
  basic: "¥29.9 基础",
  deep: "¥49.9 深度",
  relationship: "¥128 合盘",
};

// ===== Preset (pre-embedded) unlock codes =====
function pad(n: number, w: number) {
  return String(n).padStart(w, "0");
}

const PRESET_BASIC: string[] = Array.from({ length: 20 }, (_, i) => `LINGXI-${pad(i + 1, 3)}`);
const PRESET_DEEP: string[] = Array.from({ length: 20 }, (_, i) => `LINGXI-D${pad(i + 1, 2)}`);
const PRESET_RELATIONSHIP: string[] = Array.from({ length: 10 }, (_, i) => `LINGXI-H${pad(i + 1, 2)}`);

export const PRESET_CODES: Record<string, CodeTier> = (() => {
  const map: Record<string, CodeTier> = {};
  PRESET_BASIC.forEach((c) => (map[c] = "basic"));
  PRESET_DEEP.forEach((c) => (map[c] = "deep"));
  PRESET_RELATIONSHIP.forEach((c) => (map[c] = "relationship"));
  return map;
})();

export const PRESET_GROUPS: { tier: CodeTier; codes: string[] }[] = [
  { tier: "basic", codes: PRESET_BASIC },
  { tier: "deep", codes: PRESET_DEEP },
  { tier: "relationship", codes: PRESET_RELATIONSHIP },
];

export function loadUsedPresets(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(USED_PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function markPresetUsed(code: string) {
  if (!isBrowser()) return;
  const list = loadUsedPresets();
  if (!list.includes(code)) {
    list.push(code);
    localStorage.setItem(USED_PRESETS_KEY, JSON.stringify(list));
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadCodes(): UnlockCode[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CODES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as UnlockCode[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCodes(codes: UnlockCode[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(len = 4) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export function generateCode(tier: CodeTier): UnlockCode {
  const existing = loadCodes();
  let code = "";
  // ensure uniqueness
  for (let i = 0; i < 50; i++) {
    code = `灵犀-${randomSegment(4)}`;
    if (!existing.some((c) => c.code === code)) break;
  }
  const item: UnlockCode = {
    code,
    tier,
    createdAt: Date.now(),
    used: false,
  };
  saveCodes([item, ...existing]);
  return item;
}

export type RedeemResult =
  | { ok: true; tier: CodeTier; code: string }
  | { ok: false; reason: "invalid" | "used" };

export function redeemCode(input: string): RedeemResult {
  const normalized = input.trim();
  if (!normalized) return { ok: false, reason: "invalid" };

  // 1) Check preset codes first (case-insensitive on the LINGXI- prefix)
  const upper = normalized.toUpperCase();
  const presetTier = PRESET_CODES[upper];
  if (presetTier) {
    markPresetUsed(upper);
    saveMyCode({ code: upper, tier: presetTier });
    return { ok: true, tier: presetTier, code: upper };
  }

  // 2) Fall back to admin-generated codes stored in localStorage
  const codes = loadCodes();
  const idx = codes.findIndex((c) => c.code === normalized);
  if (idx === -1) return { ok: false, reason: "invalid" };
  const my = loadMyCode();
  const found = codes[idx];
  // Allow re-entering the user's own previously-redeemed code
  if (found.used && my?.code !== found.code) {
    return { ok: false, reason: "used" };
  }
  if (!found.used) {
    codes[idx] = { ...found, used: true, usedAt: Date.now() };
    saveCodes(codes);
  }
  saveMyCode({ code: found.code, tier: found.tier });
  return { ok: true, tier: found.tier, code: found.code };
}

export type MyCode = { code: string; tier: CodeTier };

export function loadMyCode(): MyCode | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(MY_CODE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MyCode;
  } catch {
    return null;
  }
}

export function saveMyCode(m: MyCode) {
  if (!isBrowser()) return;
  localStorage.setItem(MY_CODE_KEY, JSON.stringify(m));
}

export function clearMyCode() {
  if (!isBrowser()) return;
  localStorage.removeItem(MY_CODE_KEY);
}

export function loadAdminAuth(): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
}

export function setAdminAuth(ok: boolean) {
  if (!isBrowser()) return;
  if (ok) sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
  else sessionStorage.removeItem(ADMIN_AUTH_KEY);
}

export function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}