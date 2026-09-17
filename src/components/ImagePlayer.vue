<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['resolve', 'reject'])

const loaded = ref(false)

let timer = null
let safety = null
let resolved = false

/** Nothing renders until the bitmap is ready, so hold the loop until then. */
const DISPLAY_MS = 2000

/**
 * Cap on how long we wait for a decode. A cutout PNG can arrive as 20MB of
 * base64 and decode to a 4896x3264 RGBA bitmap, which takes seconds — but a
 * genuinely broken image must not park the loop forever, because nothing else
 * emits resolve/reject on our behalf.
 */
const LOAD_TIMEOUT_MS = 30000

function resolve() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  clearTimeout(safety)
  emit('resolve')
}

function reject() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  clearTimeout(safety)
  emit('reject')
}

/**
 * Start the display timer only once the image has actually decoded. Starting it
 * on mount meant a slow-decoding image was skipped before it ever appeared.
 */
function onLoad() {
  loaded.value = true
  clearTimeout(safety)
  timer = setTimeout(resolve, props.data.duration ?? DISPLAY_MS)
}

function onError() {
  console.warn('image failed to load:', props.data.key)
  reject()
}

onMounted(() => {
  resolved = false
  loaded.value = false
  safety = setTimeout(() => {
    console.warn('image took too long to load, skipping:', props.data.key)
    reject()
  }, LOAD_TIMEOUT_MS)
})

onUnmounted(() => {
  clearTimeout(timer)
  clearTimeout(safety)
})
</script>

<template>
  <div
    class="player image-player"
    @click="resolve"
  >
    <img
      :src="data.src"
      :alt="data.name"
      :class="{ ready: loaded }"
      @load="onLoad"
      @error="onError"
    >
    <div
      v-if="!loaded"
      class="loading"
    >
      <i class="fas fa-circle-notch fa-spin" />
    </div>
  </div>
</template>

<style scoped>
.image-player {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: pointer;
}

img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 120ms ease-in;
}

img.ready {
  opacity: 1;
}

.loading {
  position: absolute;
  color: rgba(255, 255, 255, 0.4);
  font-size: 22px;
}
</style>
