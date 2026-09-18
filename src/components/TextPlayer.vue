<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['resolve', 'reject'])

const content = ref('')
const loaded = ref(false)

let timer = null
let resolved = false

const DISPLAY_MS = 5000
const LOAD_TIMEOUT_MS = 15000
const MAX_CHARS = 2000

function resolve() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  emit('resolve')
}

function reject() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  emit('reject')
}

/**
 * Text arrives as a URL like every other medium, so it has to be fetched. The
 * component previously rendered `data.content ?? data.FileName` — neither of
 * which is ever sent — so every text item showed a blank screen.
 */
async function load() {
  loaded.value = false
  content.value = ''
  clearTimeout(timer)
  timer = setTimeout(reject, LOAD_TIMEOUT_MS)

  try {
    const res = await fetch(props.data.src)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    content.value = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text
  } catch (err) {
    console.warn('text failed to load:', props.data.key, err.message)
    return reject()
  }

  loaded.value = true
  clearTimeout(timer)

  // A narration (from the `speak` action, linked by a soundtrack edge) decides how
  // long the text stays up — its `ended` resolves instead of the timer.
  if (props.data.audio?.src) {
    startSoundtrack()
    return
  }
  timer = setTimeout(resolve, props.data.duration ?? DISPLAY_MS)
}

const audioEl = ref(null)

/**
 * Browsers refuse to autoplay audible media until the page has been interacted
 * with. A refused play() leaves the track paused, so `ended` never fires — and
 * because the display timer is skipped when a soundtrack exists, the loop would
 * park here forever. Fall back to the timer when that happens.
 */
async function startSoundtrack() {
  try {
    await audioEl.value?.play()
  } catch (err) {
    console.warn('soundtrack could not start, using the display timer:', err?.message)
    if (!resolved && !timer) timer = setTimeout(resolve, props.data.duration ?? DISPLAY_MS)
  }
}

/** Narration failed; fall back to the normal display timer. */
function onAudioError() {
  console.warn('narration failed to load:', props.data.audio?.key)
  if (!resolved && !timer) timer = setTimeout(resolve, props.data.duration ?? DISPLAY_MS)
}

/**
 * Scale to fill the view: short text goes very large, long text steps down so it
 * still fits. Bounded by vw so it tracks the window rather than a fixed size.
 */
const fontSize = computed(() => {
  const n = content.value.trim().length || 1
  if (n <= 12) return 'clamp(3rem, 22vw, 20rem)'
  if (n <= 40) return 'clamp(2.5rem, 13vw, 12rem)'
  if (n <= 120) return 'clamp(2rem, 8vw, 7rem)'
  if (n <= 400) return 'clamp(1.4rem, 4.5vw, 4rem)'
  if (n <= 900) return 'clamp(1.1rem, 3vw, 2.5rem)'
  return 'clamp(0.9rem, 2vw, 1.6rem)'
})

// A long line with no spaces cannot wrap on word boundaries.
const breakMode = computed(() =>
  /\s/.test(content.value.trim()) ? 'normal' : 'break-all',
)

onMounted(load)
watch(() => props.data.src, () => { resolved = false; load() })
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div
    class="player text-player"
    @click="resolve"
  >
    <p
      v-if="loaded"
      class="text-content"
      :style="{ fontSize, wordBreak: breakMode }"
    >
      {{ content }}
    </p>
    <i
      v-else
      class="fas fa-circle-notch fa-spin waiting"
    />

    <audio
      v-if="data.audio?.src"
      ref="audioEl"
      :src="data.audio.src"
      autoplay
      @ended="resolve"
      @error="onAudioError"
    />
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
  padding: 3vmin;
  overflow: hidden;
}

.text-content {
  color: #fff;
  font-family: monospace;
  font-weight: 700;
  text-align: center;
  white-space: pre-wrap;
  line-height: 1.1;
  margin: 0;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.waiting {
  color: rgba(255, 255, 255, 0.35);
  font-size: 20px;
}
</style>
