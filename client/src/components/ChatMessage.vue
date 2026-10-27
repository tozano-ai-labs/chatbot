<script setup>
defineProps({
  message: { type: Object, required: true },
});
</script>

<template>
  <div class="msg" :class="message.role">
    <div class="avatar">{{ message.role === "user" ? "Moi" : "IA" }}</div>
    <div class="bubble">
      <span v-if="!message.content" class="cursor"></span>
      <template v-else>{{ message.content }}</template>
    </div>
  </div>
</template>
