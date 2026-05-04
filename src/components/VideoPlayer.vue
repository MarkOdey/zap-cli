<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const emit = defineEmits(['resolve', 'reject'])

const videoEl = ref(null)
let resolved = false

function onTimeUpdate() {
  const v = videoEl.value
  if (!v || resolved) return
  if (v.duration && v.currentTime >= v.duration - 3) {
    resolve()
  }
}

function onEnded() {
  resolve()
}

function resolve() {
  if (resolved) return
  resolved = true
  emit('resolve')
}

onMounted(() => {
  resolved = false
})

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
      muted
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
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
