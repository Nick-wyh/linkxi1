import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(1).max(500),
  mood: z.string().max(200).optional().default(""),
  tier: z.enum(["basic", "deep", "relationship"]).default("basic"),
  partner: z.string().max(200).optional().default(""),
  relation: z.string().max(100).optional().default(""),
  cards: z.array(
    z.object({
      name: z.string(),
      position: z.string(),
      reversed: z.boolean(),
      keywords: z.array(z.string()),
    }),
  ).length(3),
});

const SYSTEM_PROMPT =
  "你叫灵犀，是一位经验丰富的塔罗占卜师。解读风格温暖有洞察力，有灵性不油腻，给人希望。";

function buildUserPrompt(data: z.infer<typeof Input>) {
  const cardLine = data.cards
    .map((c) => `${c.name}`)
    .join("、");

  if (data.tier === "basic") {
    return `用户的问题是：${data.question}，用户当前心情：${data.mood || "未透露"}。抽到的三张牌：${cardLine}。请生成一篇约800字的塔罗解读，结构：1.逐张解读每张牌与用户问题的关联 2.三张牌的综合运势分析 3.一句总结寄语。温暖不敷衍。`;
  }
  if (data.tier === "deep") {
    return `用户的问题是：${data.question}，用户当前心情：${data.mood || "未透露"}。抽到的三张牌：${cardLine}。请生成一篇约2000字的深度塔罗解读，结构：1.逐张深入解读每张牌与用户问题的深层关联 2.三张牌的相互关系和能量流动 3.针对用户问题的具体行动建议（至少3条） 4.未来7日每日运势简述 5.总结寄语。语气更深入、更私人化，让用户觉得你真正理解他的处境。`;
  }
  return `我测的是和${data.partner || "对方"}的关系，关系类型：${data.relation || "未填写"}。抽到的三张牌：${cardLine}。请生成一篇约2500字的关系合盘解读，结构：1.每张牌在关系语境下的深层含义 2.你们之间当前的能量状态和互动模式 3.对方的真实想法和态度分析 4.这段关系的潜在走向和阻碍 5.给你的具体建议（该主动/该等待/该放手） 6.总结寄语。语言真诚、不灌鸡汤，直接给出有参考价值的判断。`;
}

export const getTarotReading = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("Missing DEEPSEEK_API_KEY");

    const userPrompt = buildUserPrompt(data);

    let res: Response;
    try {
      res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.85,
          max_tokens: data.tier === "relationship" ? 3500 : data.tier === "deep" ? 2800 : 1400,
        }),
      });
    } catch {
      throw new Error("宇宙信号暂时中断，请稍后再试 ✨");
    }

    if (!res.ok) {
      throw new Error("宇宙信号暂时中断，请稍后再试 ✨");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("宇宙信号暂时中断，请稍后再试 ✨");

    return { reading: text, tier: data.tier };
  });