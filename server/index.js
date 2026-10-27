import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3000);
const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://ollama:11434").replace(/\/$/, "");
const APP_VERSION = process.env.APP_VERSION || "dev";
const TEST_MODEL = process.env.TEST_MODEL || process.env.OLLAMA_MODEL || "";

const app = express();
app.use(express.json({ limit: "1mb" }));

async function testOllamaConnection() {
  console.log(`[startup] Test de connexion à Ollama sur ${OLLAMA_HOST}...`);
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, { method: "GET" });
    if (!r.ok) {
      console.error(`[startup] Échec du test de connexion à Ollama : HTTP ${r.status}`);
      return false;
    }
    const data = await r.json().catch(() => ({}));
    const models = (data.models || []).map((m) => m.name);
    console.log(`[startup] Connexion à Ollama OK. Modèles disponibles : ${models.length > 0 ? models.join(", ") : "(aucun)"}`);
    return { ok: true, models };
  } catch (err) {
    console.error(`[startup] Impossible de joindre Ollama sur ${OLLAMA_HOST} : ${err?.message || err}`);
    return false;
  }
}

async function testShortPrompt(models) {
  const model = TEST_MODEL || (Array.isArray(models) && models.length > 0 ? models[0] : "");
  if (!model) {
    console.warn("[startup] Aucun modèle disponible pour le test de prompt court.");
    return false;
  }
  console.log(`[startup] Test de prompt court avec le modèle "${model}" ("Bonjour")...`);
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Bonjour" }],
        stream: false,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error(`[startup] Échec du test de prompt court : HTTP ${r.status} ${detail ? "- " + detail.slice(0, 200) : ""}`);
      return false;
    }
    const data = await r.json().catch(() => ({}));
    const content = data?.message?.content || data?.response || "";
    if (content && content.trim().length > 0) {
      console.log(`[startup] Test de prompt court OK. Réponse : ${content.trim().slice(0, 80).replace(/\n/g, " ")}${content.trim().length > 80 ? "..." : ""}`);
      return true;
    }
    console.warn("[startup] Test de prompt court terminé mais aucune réponse exploitable n'a été reçue.");
    return false;
  } catch (err) {
    console.error(`[startup] Erreur lors du test de prompt court : ${err?.message || err}`);
    return false;
  }
}

async function runStartupTests() {
  const conn = await testOllamaConnection();
  if (conn && conn.ok) {
    await testShortPrompt(conn.models);
  }
}

app.get("/api/version", (_req, res) => {
  res.json({ version: APP_VERSION });
});

app.get("/api/models", async (_req, res) => {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!r.ok) {
      return res.status(502).json({ error: `Ollama a répondu ${r.status}` });
    }
    const data = await r.json();
    res.json({ models: (data.models || []).map((m) => m.name) });
  } catch {
    res.status(502).json({ error: `Impossible de joindre Ollama sur ${OLLAMA_HOST}` });
  }
});

app.post("/api/chat", async (req, res) => {
  const { model, messages } = req.body || {};
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Champs requis : model, messages[]" });
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      const detail = await ollamaRes.text().catch(() => "");
      return res.status(502).json({ error: `Ollama a répondu ${ollamaRes.status}`, detail });
    }

    res.status(ollamaRes.status);
    res.set("Content-Type", "application/x-ndjson; charset=utf-8");
    res.set("Cache-Control", "no-cache");
    Readable.fromWeb(ollamaRes.body).pipe(res);
  } catch {
    res.status(502).json({ error: `Impossible de joindre Ollama sur ${OLLAMA_HOST}` });
  }
});

const distDir = path.join(__dirname, "..", "client", "dist");
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`chatbot v${APP_VERSION} → http://localhost:${PORT} (ollama: ${OLLAMA_HOST})`);
  runStartupTests();
});
