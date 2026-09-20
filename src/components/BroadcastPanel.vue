<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)
const url = ref('')
const video = ref(null)

const state = computed(() => session.broadcastState.value ?? { live: false })
const live = computed(() => !!state.value.live)

/** The API origin, derived like useSession does, so the HLS URL is reachable. */
function hlsUrl() {
  const override = import.meta.env?.VITE_API_URL
  const port = import.meta.env?.VITE_API_PORT ?? '3000'
  const base = override
    ? override.replace(/\/$/, '')
    : `${window.location.protocol}//${window.location.hostname}:${port}`
  return `${base}/broadcast/live.m3u8`
}

function uptime() {
  const ms = state.value.uptime ?? 0
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m ${s % 60}s`
}

function start() {
  session.startBroadcast(url.value ? { url: url.value } : {})
}
function stop() {
  session.stopBroadcast()
}

// Attach the HLS preview when we go live, tear it down when we stop.
let hls = null
async function attach() {
  const el = video.value
  if (!el) return
  const src = hlsUrl()

  if (el.canPlayType('application/vnd.apple.mpegurl')) {
    el.src = src // native HLS (Safari / iOS)
    return
  }
  try {
    const { default: Hls } = await import('hls.js')
    if (Hls.isSupported()) {
      detach()
      hls = new Hls({ liveDurationInfinity: true })
      hls.loadSource(src)
      hls.attachMedia(el)
    }
  } catch {
    // hls.js not available — leave the monitor blank; the stream still goes out.
  }
}
function detach() {
  if (hls) { try { hls.destroy() } catch { /* already gone */ } hls = null }
  if (video.value) video.value.removeAttribute('src')
}

watch([live, open], ([isLive, isOpen]) => {
  if (isLive && isOpen) attach()
  else detach()
})
onUnmounted(detach)
</script>

<template>
  <div class="broadcast-panel">
    <button
      class="toggle-btn"
      :class="{ live }"
      title="Live broadcast"
      @click="open = !open"
    >
      <i class="fas fa-broadcast-tower" />
      <span
        v-if="live"
        class="badge"
      >live</span>
    </button>

    <div
      v-if="open"
      class="panel"
    >
      <p class="section">
        Broadcast
      </p>

      <div class="status">
        <span
          class="dot"
          :class="{ on: live }"
        />
        <span class="label">{{ live ? 'LIVE' : 'off' }}</span>
        <span
          v-if="live"
          class="meta"
        >{{ uptime() }}</span>
      </div>

      <template v-if="live">
        <p
          v-if="state.currentKey"
          class="row"
        >
          <span class="k">now</span>
          <span class="v">{{ String(state.currentKey).split('/').pop() }}</span>
        </p>
        <p
          v-if="state.target"
          class="row"
        >
          <span class="k">to</span>
          <span class="v">{{ state.target }}</span>
        </p>
        <p class="row">
          <span class="k">aired</span>
          <span class="v">{{ state.segments ?? 0 }}</span>
        </p>
        <video
          ref="video"
          class="monitor"
          controls
          muted
          playsinline
        />
      </template>

      <template v-else>
        <input
          v-model="url"
          class="url"
          placeholder="rtmp://… (optional if set on server)"
        >
      </template>

      <p
        v-if="state.lastError"
        class="err"
      >
        {{ state.lastError }}
      </p>

      <button
        v-if="!live"
        class="action start"
        @click="start"
      >
        Start
      </button>
      <button
        v-else
        class="action stop"
        @click="stop"
      >
        Stop
      </button>
    </div>
  </div>
</template>

<style scoped>
.broadcast-panel {
  width: 36px;
  height: 36px;
  position: fixed;
  top: 16px;
  right: 112px;
  z-index: 10;
  font-family: monospace;
}

.toggle-btn {
  position: relative;
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
}
.toggle-btn:hover { background: rgba(255, 255, 255, 0.3); }
.toggle-btn.live { background: rgba(255, 70, 70, 0.5); }

.badge {
  position: absolute;
  bottom: -2px;
  right: -6px;
  padding: 0 4px;
  border-radius: 8px;
  background: #f44;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  font-weight: bold;
  text-transform: uppercase;
}

.panel {
  position: absolute;
  top: 44px;
  right: 0;
  width: 280px;
  max-height: 70vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px 12px;
}

.section {
  margin: 0 0 6px;
  color: #888;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #555; }
.dot.on { background: #f44; box-shadow: 0 0 6px #f44; }
.label { color: #ddd; font-size: 12px; }
.meta { color: #888; font-size: 10px; margin-left: auto; }

.row { display: flex; gap: 8px; margin: 2px 0; font-size: 11px; }
.row .k { color: #666; min-width: 34px; }
.row .v { color: #ddd; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.monitor {
  width: 100%;
  margin-top: 8px;
  border-radius: 4px;
  background: #000;
  aspect-ratio: 16 / 9;
}

.url {
  width: 100%;
  margin: 4px 0 8px;
  padding: 5px 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #ddd;
  font-family: monospace;
  font-size: 11px;
}

.err { color: #f88; font-size: 10px; margin: 6px 0 0; }

.action {
  width: 100%;
  margin-top: 8px;
  padding: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
}
.action.start { background: #2a6; color: #fff; }
.action.stop  { background: #a33; color: #fff; }
.action:hover { filter: brightness(1.15); }
</style>
