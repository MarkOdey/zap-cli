
<template>
  <div class="app">
    <component
      :is="currentComponent"
      v-if="currentComponent"
      :data="mediaStore.currentMedia"
      @resolve="onResolve"
      @reject="onReject"
    />

    <AppreciationControls
      @like="onLike"
      @dislike="onDislike"
      @skip="onReject"
    />

    <UploadPanel />

    <MediaList />

    <QueuePanel />

    <button
      class="cutout-btn"
      :class="{ working: cutoutBusy }"
      :title="cutoutTitle"
      :disabled="!canCutout || cutoutBusy"
      @click="cutout"
    >
      <i :class="cutoutBusy ? 'fas fa-spinner fa-spin' : 'fas fa-scissors'" />
    </button>

    <button
      class="explore-btn"
      :title="exploring ? 'Indexing…' : 'Scan data folder'"
      :disabled="exploring"
      @click="explore"
    >
      <i :class="exploring ? 'fas fa-spinner fa-spin' : 'fas fa-search'" />
    </button>

    <button
      class="playpause-btn"
      :title="paused ? 'Play' : 'Pause'"
      @click="togglePlayPause"
    >
      <i :class="paused ? 'fas fa-play' : 'fas fa-pause'" />
    </button>

    <button
      class="fullscreen-btn"
      title="Fullscreen"
      @click="toggleFullScreen"
    >
      <i class="fas fa-expand" />
    </button>

    <Terminal />
  </div>
</template>


<script setup>
import { computed, onMounted } from 'vue'
import AppreciationControls from './components/AppreciationControls.vue'
import ImagePlayer from './components/ImagePlayer.vue'
import Terminal from './components/Terminal.vue'
import TextPlayer from './components/TextPlayer.vue'
import MediaList from './components/MediaList.vue'
import QueuePanel from './components/QueuePanel.vue'
import UploadPanel from './components/UploadPanel.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import { useSession } from './composables/useSession'
import { useMediaStore } from './stores/media'

const mediaStore = useMediaStore()
const session = useSession()

onMounted(() => session.connect())

const currentComponent = computed(() => {

  console.log(mediaStore.mediaType)
  const type = mediaStore.mediaType
  if (type === 'video') return VideoPlayer
  if (type === 'image') return ImagePlayer
  if (type === 'text') return TextPlayer
  return null
})

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

// Cut shapes out of the image that is playing. The work is slow (~20s of CPU
// inference), so it goes on the queue rather than blocking — the queue panel
// shows progress, and the result lands in the library.
const canCutout = computed(
  () => mediaStore.mediaType === 'image' && !!mediaStore.currentMedia?.key,
)

const cutoutBusy = computed(() => {
  const key = mediaStore.currentMedia?.key
  if (!key) return false
  return session.jobs.value.some(
    (j) => j.action === 'isolate' && j.params?.key === key && ['queued', 'running'].includes(j.state),
  )
})

const cutoutTitle = computed(() => {
  if (cutoutBusy.value) return 'Cutting out shapes…'
  if (!canCutout.value) return 'Cut out shapes (images only)'
  return 'Cut out shapes from this image'
})

function cutout() {
  const key = mediaStore.currentMedia?.key
  if (key) session.enqueue('isolate', { key, all: true })
}

function onResolve() { session.resolve() }
function onReject()  { session.reject() }
function onLike()    { session.like() }
function onDislike() { session.dislike() }

const { paused, togglePlayPause, exploring, explore } = session
</script>



<style lang="scss">
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  font-family: monospace;
}

.app {
  position: relative;
  width: 100%;
  height: 100%;
}

.cutout-btn {
  position: fixed;
  bottom: 168px;
  left: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &.working {
    background: rgba(120, 200, 255, 0.35);
    opacity: 1;
  }
}

.explore-btn {
  position: fixed;
  bottom: 124px;
  left: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.playpause-btn {
  position: fixed;
  bottom: 80px;
  left: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.fullscreen-btn {
  position: fixed;
  bottom: 36px;
  left: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>
