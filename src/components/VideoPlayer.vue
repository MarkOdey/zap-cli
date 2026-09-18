<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useSession } from '../composables/useSession'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['resolve', 'reject'])

const session = useSession()
const videoEl = ref(null)
let resolved = false

/**
 * The element used to be hardcoded `muted`, which is why clips played silently
 * even though they carry an aac track.
 *
 * It cannot simply be dropped: browsers refuse to autoplay audible media until
 * the page has been interacted with, and a refused play() leaves the video
 * paused — so `ended` never fires and the loop parks. Instead, try with sound
 * and fall back to muted if the browser says no.
 */
async function start() {
  const video = videoEl.value
  if (!video) return

  video.muted = !session.soundOn.value

  try {
    await video.play()
  } catch {
    if (video.muted) {
      console.warn('video could not start even muted:', props.data.key)
      return
    }
    // Refused because of the sound. Remember that, so the rest of the session
    // does not keep hitting the same refusal, and offer the toggle instead.
    video.muted = true
    session.setSound(false)
    try {
      await video.play()
    } catch (err) {
      console.warn('video could not start:', err?.message)
    }
  }
}

// Turning sound on should affect the clip already playing, not just the next one.
watch(() => session.soundOn.value, (on) => {
  if (videoEl.value) videoEl.value.muted = !on
})

function onTimeUpdate() {
  const v = videoEl.value
  if (!v || resolved) return
  if (v.duration && v.currentTime >= v.duration - 3) resolve()
}

function resolve() {
  if (resolved) return
  resolved = true
  emit('resolve')
}

function onError() {
  if (resolved) return
  resolved = true
  console.warn('video failed to load:', props.data.key)
  emit('reject')
}

onMounted(() => { resolved = false })

onUnmounted(() => {
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.src = ''
  }
})
</script>

<template>
  <div class="player video-player">
    <video
      ref="videoEl"
      :src="data.src"
      autoplay
      playsinline
      @loadeddata="start"
      @timeupdate="onTimeUpdate"
      @ended="resolve"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.video-player {
  position: absolute;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
