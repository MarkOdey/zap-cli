
<template>
  <div class="app">
    <!--
      The key is load-bearing. Without it, two items of the same kind in a row
      reuse the same component instance, so onMounted never runs again and the
      player keeps `resolved` from the previous item — resolve() returns early and
      playback parks. Keying on the document forces a fresh instance per item.
    -->
    <component
      :is="currentComponent"
      v-if="currentComponent"
      :key="mediaStore.currentMedia?.key"
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

    <BroadcastPanel />

    <button
      class="sound-btn"
      :class="{ off: !soundOn }"
      :title="soundOn ? 'Sound on' : 'Sound off — click to enable'"
      @click="setSound(!soundOn)"
    >
      <i :class="soundOn ? 'fas fa-volume-up' : 'fas fa-volume-mute'" />
    </button>

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

    <TerminalPanel />
  </div>
</template>


<script setup>
import { computed, onMounted } from 'vue'
import AppreciationControls from './components/AppreciationControls.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import BroadcastPanel from './components/BroadcastPanel.vue'
import ImagePlayer from './components/ImagePlayer.vue'
import TerminalPanel from './components/TerminalPanel.vue'
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
  // null here is normal: it means nothing is playing, which is the gap between
  // items after reject() clears the store. A document whose type maps to no
  // player is warned about in stores/media.js instead.
  const type = mediaStore.mediaType
  if (type === 'video') return VideoPlayer
  if (type === 'image') return ImagePlayer
  if (type === 'audio') return AudioPlayer
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
function onDislike() {
  // Lower the weight, then move on. A thumbs-down that left the item playing read
  // as though nothing had happened — the weight change is invisible on screen.
  session.dislike()
  session.reject()
}

const { paused, togglePlayPause, exploring, explore, soundOn, setSound } = session
</script>



<style lang="scss">
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/**
 * The players are a surface you click to advance, not a document to read from, so
 * a stray drag highlighting the text of a headline or leaving a selection over a
 * photo is only ever noise. Applies to every player: each uses `.player`.
 *
 * Deliberately not global — the terminal's output and its input stay selectable,
 * because copying a result out of them is the point of having them.
 */
.player,
.player * {
  user-select: none;
  -webkit-user-select: none;
}

/* Dragging a frame out of the player produces a ghost image and a stray drop. */
.player img,
.player video {
  -webkit-user-drag: none;
  user-drag: none;
}

/* Chrome around the media: buttons and rows are for pressing, not selecting. */
.appreciation-controls,
.media-list .rows,
.media-list .head,
.queue-panel .toggle-btn,
.upload-panel .toggle-btn,
.playpause-btn,
.fullscreen-btn,
.explore-btn,
.cutout-btn,
.sound-btn {
  user-select: none;
  -webkit-user-select: none;
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

.sound-btn {
  position: fixed;
  bottom: 212px;
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

  &.off {
    color: #888;
  }
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
