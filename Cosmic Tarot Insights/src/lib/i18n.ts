export type Lang = "zh" | "en";

export type TranslationDict = typeof zh;

const zh = {
  // Site
  siteName: "灵犀塔罗",
  siteTagline: "✨ 默念你的问题，让宇宙给你答案 ✨",
  siteDescription: "默念你的问题，AI 塔罗为你揭示宇宙的指引。22 张大阿尔卡纳，神秘解读。",
  siteOgTitle: "AI 塔罗占卜 · 让宇宙给你答案",

  // Steps
  stepNameTitle: "我是灵犀，你叫什么？",
  stepNamePlaceholder: "输入你的名字或昵称",
  stepNameHint: "名字让你的能量与牌面共振",
  stepTopicTitle: "你想问什么？",
  stepQuestionTitle: "告诉我更多",
  stepQuestionSubtitle: "写得越具体，解读越准",
  stepQuestionPlaceholder: "比如：我该不该接受这份新工作？我和ta接下来三个月会怎样？",
  stepMoodTitle: "此刻你感觉如何？",
  stepRitualTitle: "连接宇宙能量",
  stepRitualText: "闭上眼睛...深呼吸三次...在你的心里默念你的问题...灵犀正在连接你的能量场...",
  stepRitualBtn: "✨ 感应到了，开始抽牌",
  stepPickTitle: "用你的直觉，选出 3 张牌",
  stepPickSub: "选了之后不能改 · 跟随直觉",
  stepPickConfirm: "🔮 翻开命运之牌",
  stepPickCount: (n: number) => `已选 ${n} / 3`,
  stepFlipTitle: "依次翻开你的牌",
  stepFlipSub: "点一下翻一张 · 倾听灵犀的低语",
  stepFlipWhisper: "灵犀低语",
  stepFlipContinue: "✨ 查看完整解读",
  stepFlipCount: (n: number) => `${n} / 3 已翻开`,
  stepInterpreting: "灵犀正在解读这张牌与你的命运共振…",
  stepInterpretingWait: "请稍候",

  // Reading
  readingTitle: "宇宙的回响",
  readingPreviewLabel: "灵犀的初探 · 摘要",
  readingUnlockedHint: "完整解读已为你呈现",
  readingLockedHint: "三张牌已为你揭示初步指引",
  readingUnlockBtn: "✨ 解锁完整解读",
  readingLoading: "灵犀正在为你感应塔罗的能量…",
  readingReset: "再占一次",

  // Positions
  positionPast: "过去",
  positionPresent: "现在",
  positionFuture: "未来",
  reversed: "逆位",
  upright: "正位",

  // Topics
  topics: [
    { id: "love", emoji: "💕", label: "感情" },
    { id: "career", emoji: "💼", label: "事业" },
    { id: "wealth", emoji: "💰", label: "财运" },
    { id: "health", emoji: "🌿", label: "健康" },
    { id: "family", emoji: "🏠", label: "家庭" },
    { id: "other", emoji: "✨", label: "其他" },
  ],

  // Moods
  moods: [
    { emoji: "😰", label: "焦虑" },
    { emoji: "🤔", label: "迷茫" },
    { emoji: "😌", label: "平静" },
    { emoji: "💔", label: "伤心" },
    { emoji: "🔥", label: "期待" },
    { emoji: "😶", label: "说不清" },
  ],

  // Back button
  back: "返回",
  continue: "继续 →",
  beginDivination: "开始占卜 →",

  // Unlock modal
  unlockTitle: "获取完整解读报告",
  unlockSub: "选择适合你的解读档位",
  unlockRelationshipTitle: "请补充对方信息",
  unlockPartnerLabel: "对方名字 / 昵称",
  unlockPartnerPlaceholder: "例如：小M",
  unlockRelationLabel: "你们的关系",
  unlockRelationPlaceholder: "例如：暧昧 / 恋爱 / 分手 / 暗恋",
  unlockBackToTiers: "← 返回选档位",
  unlockGenerate: "生成合盘",
  unlockRecommended: "🔥 推荐",
  unlockWechatHint: "扫码加微信购买 →",
  unlockWechatNote: "付款后截图发微信，5 分钟内发送完整报告",
  unlockCodeLabel: "输入解锁码",
  unlockCodeHint: "付款后微信会发给你解锁码",
  unlockCodePlaceholder: "LINGXI-XXX",
  unlockCodeBtn: "解锁",
  unlockCodeSuccess: (tier: string) => `验证成功 · ${tier}`,
  unlockCodeInvalid: "解锁码无效，请检查后重试",
  unlockCodeUsed: "该解锁码已被使用",

  // Tiers
  tierBasic: "基础解读",
  tierBasicDesc: "完整三张牌解析（约 800 字）",
  tierDeep: "深度解读",
  tierDeepDesc: "深度解析 + 行动建议（约 2000 字）",
  tierRelation: "关系合盘",
  tierRelationDesc: "两人关系深度分析报告",

  // Footer
  footerContact: "CONTACT",
  footerWechat: "如需深度咨询或定制占卜，请添加微信：",
  footerDisclaimer: "© {year} AI 塔罗占卜 · 仅供娱乐参考",
  footerCodeHint: "解锁码为一次性使用，仅限本人查阅",

  // Secret
  secretTitle: "预设解锁码列表",
  secretUsed: "已使用",
  secretUnused: "未用",
  secretTotal: (total: number, used: number) => `共 ${total} 个 · 已使用 ${used} 个`,
  secretClose: "关闭",

  // Lang switch
  langLabel: "English",

  // Common
  close: "关闭",
  universeError: "宇宙信号暂时中断，请稍后再试 ✨",

  // Payment (Lemon Squeezy placeholder)
  lemonSqueezyLabel: "Pay with Card",
  lemonSqueezyHint: "Secure payment via Lemon Squeezy · Instant access",
} as const;

const en: TranslationDict = {
  siteName: "Lingxi Tarot",
  siteTagline: "✨ Whisper your question. The Universe will answer. ✨",
  siteDescription: "Get an instant AI-powered tarot reading. 22 Major Arcana cards, deeply personalized interpretations.",
  siteOgTitle: "Lingxi Tarot — Instant AI Tarot Reading",

  stepNameTitle: "I'm Lingxi. What's your name?",
  stepNamePlaceholder: "Your name or nickname",
  stepNameHint: "Your name connects your energy to the cards",
  stepTopicTitle: "What's on your mind?",
  stepQuestionTitle: "Tell me more",
  stepQuestionSubtitle: "The more specific your question, the clearer the answer",
  stepQuestionPlaceholder: "e.g. Should I take the new job? Where is my relationship heading?",
  stepMoodTitle: "How are you feeling right now?",
  stepRitualTitle: "Connecting to the Universe",
  stepRitualText: "Close your eyes... take three deep breaths... whisper your question... Lingxi is attuning to your energy...",
  stepRitualBtn: "✨ I Feel It — Let Me Pick",
  stepPickTitle: "Trust your intuition. Pick 3 cards.",
  stepPickSub: "Once chosen, cannot change · Follow your instinct",
  stepPickConfirm: "🔮 Reveal Your Destiny",
  stepPickCount: (n: number) => `Picked ${n} / 3`,
  stepFlipTitle: "Reveal your cards, one by one",
  stepFlipSub: "Tap to flip · Listen to Lingxi's whisper",
  stepFlipWhisper: "Lingxi's Whisper",
  stepFlipContinue: "✨ View Your Reading",
  stepFlipCount: (n: number) => `${n} / 3 revealed`,
  stepInterpreting: "Lingxi is channeling the wisdom of the cards for you…",
  stepInterpretingWait: "Please wait",

  readingTitle: "Echoes of the Universe",
  readingPreviewLabel: "Lingxi's First Glimpse · Preview",
  readingUnlockedHint: "Your full reading is revealed",
  readingLockedHint: "Three cards have revealed their initial guidance",
  readingUnlockBtn: "✨ Unlock Full Reading",
  readingLoading: "Lingxi is weaving the tarot's energy for you…",
  readingReset: "New Reading",

  positionPast: "Past",
  positionPresent: "Present",
  positionFuture: "Future",
  reversed: "Reversed",
  upright: "Upright",

  topics: [
    { id: "love", emoji: "💕", label: "Love" },
    { id: "career", emoji: "💼", label: "Career" },
    { id: "wealth", emoji: "💰", label: "Finances" },
    { id: "health", emoji: "🌿", label: "Wellness" },
    { id: "family", emoji: "🏠", label: "Family" },
    { id: "other", emoji: "✨", label: "Other" },
  ],

  moods: [
    { emoji: "😰", label: "Anxious" },
    { emoji: "🤔", label: "Confused" },
    { emoji: "😌", label: "Calm" },
    { emoji: "💔", label: "Heartbroken" },
    { emoji: "🔥", label: "Excited" },
    { emoji: "😶", label: "Not Sure" },
  ],

  back: "Back",
  continue: "Continue →",
  beginDivination: "Begin Reading →",

  unlockTitle: "Unlock Your Full Reading",
  unlockSub: "Choose your reading tier",
  unlockRelationshipTitle: "Tell me about your person",
  unlockPartnerLabel: "Their name / nickname",
  unlockPartnerPlaceholder: "e.g. Alex",
  unlockRelationLabel: "Your relationship",
  unlockRelationPlaceholder: "e.g. Dating / Ex / Crush / Partner",
  unlockBackToTiers: "← Back to tiers",
  unlockGenerate: "Generate Reading",
  unlockRecommended: "🔥 Popular",
  unlockWechatHint: "Scan WeChat QR to pay →",
  unlockWechatNote: "Send payment screenshot on WeChat, receive your code within 5 minutes",
  unlockCodeLabel: "Enter Unlock Code",
  unlockCodeHint: "You'll receive the code on WeChat after payment",
  unlockCodePlaceholder: "LINGXI-XXX",
  unlockCodeBtn: "Unlock",
  unlockCodeSuccess: (tier: string) => `Verified · ${tier}`,
  unlockCodeInvalid: "Invalid code, please check and try again",
  unlockCodeUsed: "This code has already been used",

  tierBasic: "Quick Reading",
  tierBasicDesc: "Full 3-card interpretation (~800 words)",
  tierDeep: "Deep Insight",
  tierDeepDesc: "In-depth analysis + action guide (~2,000 words)",
  tierRelation: "Soul Bond",
  tierRelationDesc: "Two-person relationship deep dive",

  footerContact: "CONTACT",
  footerWechat: "For custom readings, add me on WeChat:",
  footerDisclaimer: "© {year} Lingxi Tarot · For entertainment purposes",
  footerCodeHint: "Unlock codes are single-use only",

  secretTitle: "Preset Unlock Codes",
  secretUsed: "Used",
  secretUnused: "Available",
  secretTotal: (total: number, used: number) => `${total} total · ${used} used`,
  secretClose: "Close",

  langLabel: "中文",

  close: "Close",
  universeError: "The cosmic signal is temporarily down. Please try again ✨",

  lemonSqueezyLabel: "Pay with Card",
  lemonSqueezyHint: "Secure payment via Lemon Squeezy · Instant access",
} as const;

export const translations: Record<Lang, TranslationDict> = { zh, en };
