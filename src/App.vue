<script setup>
import { computed, onMounted } from 'vue'
import AppreciationControls from './components/AppreciationControls.vue'
import ImagePlayer from './components/ImagePlayer.vue'
import Terminal from './components/Terminal.vue'
import TextPlayer from './components/TextPlayer.vue'
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

function onResolve() { session.resolve() }
function onReject() { session.reject() }

const { paused, togglePlayPause } = session
</script>

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
      @like="onResolve"
      @dislike="onReject"
      @skip="onReject"
    />

    <UploadPanel />

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
