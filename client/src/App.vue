<script setup>
import { ref, onMounted, nextTick } from "vue";
import ChatMessage from "./components/ChatMessage.vue";

const version = ref(typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev");
const models = ref([]);
const model = ref("");
const messages = ref([]);
const input = ref("");
const streaming = ref(false);
const error = ref("");
const listEl = ref(null);

function scrollToBottom() {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  });
}

onMounted(async () => {
  try {
    const r = await fetch("/api/version");
    if (r.ok) version.value = (await r.json()).version;
  } catch {}
  try {
    const r = await fetch("/api/models");
    if (r.ok) {
      models.value = (await r.json()).models || [];
      if (models.value.length) model.value = models.value[0];
    }
  } catch {
    error.value = "Impossible de contacter l'API du chatbot.";
  }
});

async function send() {
  const text = input.value.trim();
  if (!text || streaming.value || !model.value) return;

  error.value = "";
  input.value = "";
  messages.value.push({ role: "user", content: text });
  messages.value.push({ role: "assistant", content: "" });
  const reply = messages.value[messages.value.length - 1];
  streaming.value = true;
  scrollToBottom();

  try {
    const history = messages.value
      .slice(0, -1)
      .map(({ role, content }) => ({ role, content }));
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.value, messages: history }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || `Erreur HTTP ${r.status}`);
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const processLine = (line) => {
      if (!line.trim()) return;
      const obj = JSON.parse(line);
      if (obj.error) throw new Error(obj.error);
      if (obj.message?.content) {
        reply.content += obj.message.content;
        scrollToBottom();
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        processLine(line);
      }
    }
    if (buffer.trim()) {
      processLine(buffer);
    }
    if (!reply.content) throw new Error("Réponse vide du modèle.");
  } catch (e) {
    error.value = e.message || "Erreur inconnue.";
    if (!reply.content) messages.value.pop();
  } finally {
    streaming.value = false;
    scrollToBottom();
  }
}

function clearChat() {
  if (streaming.value) return;
  messages.value = [];
  error.value = "";
}
</script>

<template>
  <div class="chat-app">
    <header class="chat-header">
      <div class="brand">
        <h1>Chatbot</h1>
        <span class="version">v{{ version }}</span>
      </div>
      <div class="header-actions">
        <select v-model="model" :disabled="streaming || !models.length" title="Modèle">
          <option v-if="!models.length" value="">Aucun modèle</option>
          <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
        </select>
        <button class="clear" :disabled="streaming || !messages.length" @click="clearChat">
          Nouvelle conversation
        </button>
      </div>
    </header>

    <main ref="listEl" class="chat-list" aria-live="polite">
      <div v-if="!messages.length" class="empty">
        Posez votre question à l'IA locale…<br />
        <small>Modèles disponibles dans le sélecteur en haut à droite.</small>
      </div>
      <ChatMessage v-for="(m, i) in messages" :key="i" :message="m" />
      <div v-if="streaming && !messages.at(-1)?.content" class="thinking">Réflexion en cours…</div>
    </main>

    <p v-if="error" class="error">{{ error }}</p>

    <footer class="chat-footer">
      <textarea
        v-model="input"
        rows="1"
        placeholder="Écrivez un message… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
        :disabled="streaming || !model"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="send" :disabled="streaming || !input.trim() || !model" @click="send">
        {{ streaming ? "…" : "Envoyer" }}
      </button>
    </footer>
  </div>
</template>
