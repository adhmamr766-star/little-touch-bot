require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  SHARED_SECRET,
  ALLOWED_ORIGIN = "*",
  PORT = 3000,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment. See .env.example");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(cors({ origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN.split(",") }));

// basic in-memory rate limit: max 20 requests / 10 min per IP
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = 20;
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

function esc(s = "") {
  return String(s).slice(0, 500).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

app.post("/order", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });

    if (SHARED_SECRET && req.get("x-shared-secret") !== SHARED_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const b = req.body || {};
    // Never accept card numbers / CVV / expiry here — order notifications only.
    const required = ["productName", "size", "embroideredName", "customerName", "phone", "emirate", "address"];
    for (const f of required) {
      if (!b[f] || !String(b[f]).trim()) {
        return res.status(400).json({ ok: false, error: `missing_${f}` });
      }
    }

    const text =
      `🧸 *طلب جديد — Little Touch*\n\n` +
      `*المنتج:* ${esc(b.productName)}\n` +
      `*المقاس:* ${esc(b.size)}\n` +
      `*الاسم المطرّز:* ${esc(b.embroideredName)}\n` +
      (b.color ? `*اللون:* ${esc(b.color)}\n` : "") +
      (b.thread ? `*لون الخيط:* ${esc(b.thread)}\n` : "") +
      `\n*بيانات العميل:*\n` +
      `الاسم: ${esc(b.customerName)}\n` +
      `الموبايل: ${esc(b.phone)}\n` +
      `الإمارة: ${esc(b.emirate)}\n` +
      `العنوان: ${esc(b.address)}\n` +
      (b.total ? `\n*الإجمالي:* ${esc(b.total)}` : "") +
      (b.paymentMethod ? `\n*طريقة الدفع:* ${esc(b.paymentMethod)}` : "");

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return res.status(502).json({ ok: false, error: "telegram_failed" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Order relay listening on port ${PORT}`));
