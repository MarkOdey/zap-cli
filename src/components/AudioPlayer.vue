<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['resolve', 'reject'])

const audioEl = ref(null)
const ready = ref(false)
let resolved = false
let safety = null

/** A track that never loads must not park the loop. */
const LOAD_TIMEOUT_MS = 30000

function resolve() {
  if (resolved) return
  resolved = true
  clearTimeout(safety)
  emit('resolve')
}

function reject() {
  if (resolved) return
  resolved = true
  clearTimeout(safety)
  emit('reject')
}

function onReady() {
  ready.value = true
  clearTimeout(safety)
}

function onError() {
  console.warn('audio failed to load:', props.data.key)
  reject()
}

onMounted(() => {
  resolved = false
  ready.value = false
  safety = setTimeout(() => {
    console.warn('audio took too long to load, skipping:', props.data.key)
    reject()
  }, LOAD_TIMEOUT_MS)
})

onUnmounted(() => {
  clearTimeout(safety)
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.src = ''
  }
})
</script>

<template>
  <div
    class="player audio-player"
    @click="resolve"
  >
    <audio
      ref="audioEl"
      :src="data.src"
      autoplay
      controls
      @canplay="onReady"
      @ended="resolve"
      @error="onError"
    />
    <p class="name">
      {{ data.name }}
    </p>
    <i
      v-if="!ready"
      class="fas fa-circle-notch fa-spin waiting"
    />
  </div>
</template>

<style scoped>
.audio-player {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: #000;
  cursor: pointer;
  padding: 2rem;
}

audio {
  width: min(560px, 80vw);
}

.name {
  color: #888;
  font-family: monospace;
  font-size: 13px;
  text-align: center;
  word-break: break-all;
  max-width: 80vw;
  margin: 0;
}

.waiting {
  color: rgba(255, 255, 255, 0.35);
  font-size: 20px;
}
</style>
