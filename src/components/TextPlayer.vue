<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const emit = defineEmits(['resolve', 'reject'])

let timer = null
let resolved = false

function resolve() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  emit('resolve')
}

onMounted(() => {
  resolved = false
  const duration = props.data.duration ?? 5000
  timer = setTimeout(resolve, duration)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div class="player text-player" @click="resolve">
    <p class="text-content">{{ data.content ?? data.FileName }}</p>
  </div>
</template>

<style scoped>
.text-player {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: pointer;
  padding: 2rem;
}

.text-content {
  color: #fff;
  font-family: monospace;
  font-size: clamp(1rem, 3vw, 2rem);
  text-align: center;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
