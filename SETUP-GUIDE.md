# Lingxi Tarot 英文版 · 上线配置指南

## ✅ 我已完成

`tarot-site/index-en.html` 已创建，包含：
- 全英文界面（标题、步骤、塔罗牌、解读）
- Lemon Squeezy 自动收款
- 完整 SEO（Open Graph、Twitter Card、结构化数据）
- 语言切换按钮（中文 ↔ 英文）
- 按次付费模式（$4.99 / $9.99 / $19.99）

---

## 🔧 你需要做的 3 件事（15 分钟搞定）

### 1. 注册 Lemon Squeezy

1. 打开 https://www.lemonsqueezy.com
2. 点右上角 **Sign Up**
3. 用邮箱注册（不需要公司，个人即可）
4. 验证邮箱后登录

### 2. 创建 3 个产品

进入后台 → **Products** → **New Product**，创建 3 个数字产品：

| 产品名 | 价格 | 类型 |
|--------|------|------|
| Quick Tarot Reading | $4.99 | Digital product |
| Deep Insight Tarot | $9.99 | Digital product |
| Soul Bond Reading | $19.99 | Digital product |

每个产品创建后，会得到一个 **checkout link**，类似：
```
https://你的店铺名.lemonsqueezy.com/checkout/buy/xxxxx
```

### 3. 填入代码

把 3 个链接发给我，我帮你填入 `index-en.html`。

或者你自己改：打开 `index-en.html`，找到第 393 行附近：

```javascript
const LEMON_SQUEEZY_LINKS = {
  'basic':   'https://YOUR_STORE.lemonsqueezy.com/checkout/buy/改成你的链接',
  'deep':    'https://YOUR_STORE.lemonsqueezy.com/checkout/buy/改成你的链接',
  'couple':  'https://YOUR_STORE.lemonsqueezy.com/checkout/buy/改成你的链接'
};
```

### （可选）填入 DeepSeek API Key

同一文件第 458 行：
```javascript
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY'; // 改成你的 key
```

如果没有 DeepSeek key，站点也可以正常工作（会使用兜底的写死解读）。

---

## 🚀 上线

你的站点已经在 GitHub Pages 上了（`tarot-site/index.html`）。

英文版也在同一目录下：
```
https://你的域名/tarot-site/index-en.html
```

把 Lemon Squeezy 链接填好后，直接就可以收美元了。

---

## 📋 你还需要准备的（后续扩展）

- 一个独立域名（推荐 Namecheap，$10/年，如 lingxitarot.com）
- 绑定到 GitHub Pages
- Reddit/Twitter/Pinterest 账号（开始发内容引流）
