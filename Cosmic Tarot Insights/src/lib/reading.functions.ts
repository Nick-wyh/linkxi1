const DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY"; // Replace with your actual key

const SYSTEM_PROMPT_ZH = "你叫灵犀，是一位经验丰富的塔罗占卜师。解读风格温暖有洞察力，有灵性不油腻，给人希望。";
const SYSTEM_PROMPT_EN = "You are Lingxi, an experienced tarot reader. Your readings are warm, psychologically insightful, and spiritually grounded — never cheesy. You always end on a hopeful, empowering note.";

interface ReadingInput {
  question: string; mood?: string; tier: "basic" | "deep" | "relationship";
  partner?: string; relation?: string;
  cards: Array<{ name: string; position: string; reversed: boolean; keywords: string[] }>;
  lang?: string;
}

function buildUserPrompt(data: ReadingInput) {
  const isEn = data.lang === "en";
  const cardLine = data.cards.map((c) => `${c.name}`).join(", ");

  if (isEn) {
    if (data.tier === "basic") {
      return `The querent asks: "${data.question}". Their mood: ${data.mood || "not shared"}. Cards drawn: ${cardLine}. Write a warm, insightful ~800 word tarot reading. Structure: 1. Card-by-card interpretation tied to their question 2. Synthesis of the three cards together 3. A closing message of hope and empowerment. Make it personal and specific — avoid generic fortune-telling.`;
    }
    if (data.tier === "deep") {
      return `The querent asks: "${data.question}". Their mood: ${data.mood || "not shared"}. Cards drawn: ${cardLine}. Write a thorough ~2000 word tarot reading. Structure: 1. Deep dive into each card's meaning for their specific situation 2. How the three cards interact and the energy flow between them 3. 3-4 specific, practical action steps 4. A brief 7-day forecast 5. A personal, empowering closing note. Write like a wise friend who truly understands — not a generic horoscope.`;
    }
    return `I'm doing a relationship reading about me and ${data.partner || "someone"}. Our relationship: ${data.relation || "not specified"}. Cards drawn: ${cardLine}. Write a ~2500 word relationship reading. Structure: 1. Each card in the context of this relationship 2. The current energy between us 3. Their likely perspective and feelings 4. Potential trajectory and obstacles 5. Clear guidance — should I lean in, be patient, or let go? 6. Closing message. Be honest and helpful — no empty platitudes.`;
  }

  // Chinese prompts (original)
  if (data.tier === "basic") {
    return `用户的问题是：${data.question}，用户当前心情：${data.mood || "未透露"}。抽到的三张牌：${cardLine}。请生成一篇约800字的塔罗解读，结构：1.逐张解读每张牌与用户问题的关联 2.三张牌的综合运势分析 3.一句总结寄语。温暖不敷衍。`;
  }
  if (data.tier === "deep") {
    return `用户的问题是：${data.question}，用户当前心情：${data.mood || "未透露"}。抽到的三张牌：${cardLine}。请生成一篇约2000字的深度塔罗解读，结构：1.逐张深入解读每张牌与用户问题的深层关联 2.三张牌的相互关系和能量流动 3.针对用户问题的具体行动建议（至少3条） 4.未来7日每日运势简述 5.总结寄语。语气更深入、更私人化，让用户觉得你真正理解他的处境。`;
  }
  return `我测的是和${data.partner || "对方"}的关系，关系类型：${data.relation || "未填写"}。抽到的三张牌：${cardLine}。请生成一篇约2500字的关系合盘解读，结构：1.每张牌在关系语境下的深层含义 2.你们之间当前的能量状态和互动模式 3.对方的真实想法和态度分析 4.这段关系的潜在走向和阻碍 5.给你的具体建议（该主动/该等待/该放手） 6.总结寄语。语言真诚、不灌鸡汤，直接给出有参考价值的判断。`;
}

export async function getTarotReading(data: ReadingInput) {
  const isEn = data.lang === "en";
  const userPrompt = buildUserPrompt(data);
  const systemPrompt = isEn ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;

  let res: Response;
  try {
    res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: data.tier === "relationship" ? 3500 : data.tier === "deep" ? 2800 : 1400,
      }),
    });
  } catch {
    throw new Error(isEn ? "The cosmic signal is temporarily down. Please try again ✨" : "宇宙信号暂时中断，请稍后再试 ✨");
  }
  if (!res.ok) throw new Error(isEn ? "The cosmic signal is temporarily down. Please try again ✨" : "宇宙信号暂时中断，请稍后再试 ✨");
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error(isEn ? "The cosmic signal is temporarily down. Please try again ✨" : "宇宙信号暂时中断，请稍后再试 ✨");
  return { reading: text, tier: data.tier };
}
