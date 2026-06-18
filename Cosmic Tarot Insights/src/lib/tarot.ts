export type TarotCard = {
  id: number;
  name: string;
  nameEn: string;
  keywords: string[];
  upright: string;
  reversed: string;
  symbol: string;
};

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: "愚者", nameEn: "The Fool", keywords: ["新开始", "自由", "冒险"], upright: "开启全新旅程，保持赤子之心。", reversed: "鲁莽冲动，需三思而行。", symbol: "✦" },
  { id: 1, name: "魔术师", nameEn: "The Magician", keywords: ["创造", "意志", "行动"], upright: "你拥有实现愿望的全部工具。", reversed: "天赋未被善用，警惕欺骗。", symbol: "∞" },
  { id: 2, name: "女祭司", nameEn: "The High Priestess", keywords: ["直觉", "潜意识", "神秘"], upright: "倾听内在声音，答案在心中。", reversed: "忽视直觉，被表象迷惑。", symbol: "☽" },
  { id: 3, name: "皇后", nameEn: "The Empress", keywords: ["丰盛", "母性", "创造力"], upright: "滋养与丰收正在到来。", reversed: "依赖或情感的窒息感。", symbol: "♀" },
  { id: 4, name: "皇帝", nameEn: "The Emperor", keywords: ["权威", "结构", "掌控"], upright: "建立秩序，掌握主导权。", reversed: "专制或权力被削弱。", symbol: "♂" },
  { id: 5, name: "教皇", nameEn: "The Hierophant", keywords: ["传统", "信仰", "指引"], upright: "寻求智者的教导与传统智慧。", reversed: "挑战权威，走自己的路。", symbol: "✟" },
  { id: 6, name: "恋人", nameEn: "The Lovers", keywords: ["爱", "选择", "结合"], upright: "深刻的连接与重要抉择。", reversed: "失衡的关系或错误选择。", symbol: "♥" },
  { id: 7, name: "战车", nameEn: "The Chariot", keywords: ["意志", "胜利", "前进"], upright: "凭借决心驾驭一切阻碍。", reversed: "方向迷失，自我失控。", symbol: "⚔" },
  { id: 8, name: "力量", nameEn: "Strength", keywords: ["勇气", "温柔", "驯服"], upright: "以柔克刚，内在力量觉醒。", reversed: "自我怀疑，能量被压抑。", symbol: "∞" },
  { id: 9, name: "隐者", nameEn: "The Hermit", keywords: ["内省", "孤独", "智慧"], upright: "独处中寻得真理之光。", reversed: "孤立或拒绝指引。", symbol: "✦" },
  { id: 10, name: "命运之轮", nameEn: "Wheel of Fortune", keywords: ["转变", "命运", "循环"], upright: "命运转动，幸运降临。", reversed: "厄运或循环停滞。", symbol: "☸" },
  { id: 11, name: "正义", nameEn: "Justice", keywords: ["公正", "因果", "真相"], upright: "公平的裁决与真相显现。", reversed: "不公或逃避责任。", symbol: "⚖" },
  { id: 12, name: "倒吊人", nameEn: "The Hanged Man", keywords: ["牺牲", "新视角", "暂停"], upright: "换个角度，臣服带来洞见。", reversed: "无谓牺牲或停滞不前。", symbol: "☥" },
  { id: 13, name: "死神", nameEn: "Death", keywords: ["结束", "转化", "重生"], upright: "旧事物结束，新生即将到来。", reversed: "抗拒改变，停滞腐朽。", symbol: "☠" },
  { id: 14, name: "节制", nameEn: "Temperance", keywords: ["平衡", "调和", "耐心"], upright: "中庸之道，调和万物。", reversed: "失衡或过度。", symbol: "∆" },
  { id: 15, name: "恶魔", nameEn: "The Devil", keywords: ["束缚", "诱惑", "欲望"], upright: "被欲望或执念所束缚。", reversed: "挣脱枷锁，重获自由。", symbol: "♅" },
  { id: 16, name: "塔", nameEn: "The Tower", keywords: ["崩塌", "顿悟", "剧变"], upright: "旧结构崩塌，真相显现。", reversed: "避免灾难，缓慢瓦解。", symbol: "⚡" },
  { id: 17, name: "星星", nameEn: "The Star", keywords: ["希望", "灵感", "宁静"], upright: "黑夜过后，希望之光闪耀。", reversed: "失去信心，灵感枯竭。", symbol: "✶" },
  { id: 18, name: "月亮", nameEn: "The Moon", keywords: ["幻象", "潜意识", "迷惘"], upright: "穿越迷雾，直面潜在恐惧。", reversed: "幻象消散，真相浮现。", symbol: "☾" },
  { id: 19, name: "太阳", nameEn: "The Sun", keywords: ["喜悦", "成功", "光明"], upright: "圆满、喜悦与无限活力。", reversed: "短暂阴霾，喜悦延迟。", symbol: "☀" },
  { id: 20, name: "审判", nameEn: "Judgement", keywords: ["觉醒", "重生", "召唤"], upright: "重大觉醒，回应内心召唤。", reversed: "拒绝改变，自我评判。", symbol: "✧" },
  { id: 21, name: "世界", nameEn: "The World", keywords: ["圆满", "完成", "成就"], upright: "旅程圆满，达成大成就。", reversed: "未竟之事，需再努力。", symbol: "⊕" },
];

export type DrawnCard = {
  card: TarotCard;
  reversed: boolean;
  position: "过去" | "现在" | "未来";
};

export function drawThree(): DrawnCard[] {
  const positions: DrawnCard["position"][] = ["过去", "现在", "未来"];
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((card, i) => ({
    card,
    reversed: Math.random() < 0.4,
    position: positions[i],
  }));
}