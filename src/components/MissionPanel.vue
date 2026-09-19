<script setup>
import { computed, ref, watch } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)
const text = ref('')
const busy = ref(false)
const note = ref('')

const mission = computed(() => session.currentMission.value)
const theme = computed(() => session.theme.value)

// Opt-in "nudge": briefly surface a new mission even when the panel is closed.
const NUDGE_KEY = 'zap:nudge'
function readNudge() {
  try { return window.localStorage.getItem(NUDGE_KEY) === 'on' } catch { return false }
}
const nudge = ref(readNudge())
function setNudge(on) {
  nudge.value = on
  try { window.localStorage.setItem(NUDGE_KEY, on ? 'on' : 'off') } catch { /* private mode */ }
}

const toast = ref(false)
let toastTimer = null
watch(() => mission.value?.key, (key) => {
  if (key && nudge.value && !open.value) {
    toast.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = false }, 8000)
  }
})

const accepts = computed(() => mission.value?.accepts ?? [])
const wantsText = computed(() => accepts.value.includes('text'))
const wantsMedia = computed(() => accepts.value.includes('image') || accepts.value.includes('video'))
const fileAccept = computed(() => {
  const a = []
  if (accepts.value.includes('image')) a.push('image/*')
  if (accepts.value.includes('video')) a.push('video/*')
  return a.join(',')
})

function themeLabel() {
  const t = theme.value
  if (!t?.label) return ''
  return t.domain && t.domain !== 'seasonal' ? `${t.label} · ${t.domain}` : t.label
}

async function sendText() {
  if (!mission.value || !text.value.trim()) return
  busy.value = true
  const res = await session.answerMission(mission.value.key, { text: text.value.trim() })
  busy.value = false
  note.value = res.ok === false ? (res.error || 'failed') : 'thanks!'
  text.value = ''
  setTimeout(() => { note.value = '' }, 3000)
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file || !mission.value) return
  busy.value = true
  try {
    const payload = await readFile(file)
    const res = await session.answerMission(mission.value.key, {
      meta: { name: file.name, type: file.type }, payload,
    })
    note.value = res.ok === false ? (res.error || 'failed') : 'thanks!'
  } catch (err) {
    note.value = err?.message ?? 'could not read file'
  }
  busy.value = false
  e.target.value = ''
  setTimeout(() => { note.value = '' }, 3000)
}

function dismiss() {
  if (mission.value) session.dismissMission(mission.value.key)
  toast.value = false
}
</script>

<template>
  <div class="mission-panel">
    <button
      class="toggle-btn"
      :class="{ has: !!mission }"
      title="Missions"
      @click="open = !open; toast = false"
    >
      <i class="fas fa-lightbulb" />
      <span
        v-if="mission"
        class="badge"
      >!</span>
    </button>

    <!-- Non-intrusive nudge; never a modal over the player. -->
    <div
      v-if="toast && mission"
      class="toast"
      @click="open = true; toast = false"
    >
      <span class="t-label">{{ mission.prompt }}</span>
      <span class="t-hint">tap to answer</span>
    </div>

    <div
      v-if="open"
      class="panel"
    >
      <p class="section">
        Mission
        <span
          v-if="themeLabel()"
          class="theme"
        >🎯 {{ themeLabel() }}</span>
      </p>

      <template v-if="mission">
        <p class="prompt">
          {{ mission.prompt }}
        </p>

        <template v-if="wantsText">
          <textarea
            v-model="text"
            class="answer"
            placeholder="type your answer…"
            rows="3"
          />
          <button
            class="action"
            :disabled="busy || !text.trim()"
            @click="sendText"
          >
            Send
          </button>
        </template>

        <template v-if="wantsMedia">
          <label class="file">
            <i class="fas fa-camera" /> Answer with a photo or video
            <input
              type="file"
              :accept="fileAccept"
              capture="environment"
              hidden
              @change="onFile"
            >
          </label>
        </template>

        <div class="foot">
          <button
            class="link"
            @click="dismiss"
          >
            dismiss
          </button>
          <span
            v-if="note"
            class="note"
          >{{ note }}</span>
        </div>
      </template>

      <p
        v-else
        class="empty"
      >
        no mission right now
      </p>

      <label class="nudge">
        <input
          type="checkbox"
          :checked="nudge"
          @change="setNudge($event.target.checked)"
        >
        nudge me between items
      </label>
    </div>
  </div>
</template>

<style scoped>
.mission-panel {
  width: 36px; height: 36px;
  position: fixed; top: 16px; right: 160px;
  z-index: 10; font-family: monospace;
}
.toggle-btn {
  position: relative; width: 36px; height: 36px;
  border: none; border-radius: 50%;
  background: rgba(255, 255, 255, 0.15); color: #fff;
  font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.toggle-btn:hover { background: rgba(255, 255, 255, 0.3); }
.toggle-btn.has { background: rgba(255, 210, 90, 0.4); }
.badge {
  position: absolute; top: -2px; right: -2px;
  min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 8px; background: #ffcf5a; color: #000;
  font-size: 10px; line-height: 16px; font-weight: bold;
}
.toast {
  position: absolute; top: 44px; right: 0; width: 240px;
  background: rgba(255, 207, 90, 0.95); color: #000;
  border-radius: 6px; padding: 8px 10px; cursor: pointer;
  display: flex; flex-direction: column; gap: 2px;
}
.t-label { font-size: 12px; }
.t-hint { font-size: 9px; opacity: 0.7; text-transform: uppercase; }
.panel {
  position: absolute; top: 44px; right: 0; width: 260px;
  max-height: 70vh; overflow-y: auto;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px; padding: 10px 12px;
}
.section {
  margin: 0 0 6px; color: #888; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em;
  display: flex; justify-content: space-between; gap: 6px;
}
.theme { color: #ffcf5a; text-transform: none; letter-spacing: 0; }
.prompt { color: #eee; font-size: 13px; margin: 0 0 8px; line-height: 1.35; }
.answer {
  width: 100%; box-sizing: border-box; resize: vertical;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px; color: #ddd; font-family: monospace; font-size: 12px; padding: 6px;
}
.action {
  width: 100%; margin-top: 6px; padding: 6px; border: none; border-radius: 4px;
  background: #2a6; color: #fff; cursor: pointer; font-family: monospace; font-size: 12px;
}
.action:disabled { opacity: 0.4; cursor: not-allowed; }
.file {
  display: block; margin-top: 8px; padding: 8px; text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.3); border-radius: 4px;
  color: #ccc; font-size: 12px; cursor: pointer;
}
.file:hover { background: rgba(255, 255, 255, 0.06); }
.foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.link { border: none; background: none; color: #888; cursor: pointer; font-size: 11px; text-decoration: underline; }
.note { color: #6c6; font-size: 11px; }
.empty { color: #666; font-size: 12px; margin: 4px 0; }
.nudge { display: flex; align-items: center; gap: 6px; margin-top: 10px; color: #888; font-size: 11px; }
</style>
