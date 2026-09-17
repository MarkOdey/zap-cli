<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)

// Ticks once a second so the scheduler countdowns move without server traffic.
const now = ref(Date.now())
const timer = setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => clearInterval(timer))

const ACTIVE = ['queued', 'running']

const active = computed(() => session.jobs.value.filter(j => ACTIVE.includes(j.state)))
const history = computed(() =>
  session.jobs.value.filter(j => !ACTIVE.includes(j.state)).slice(-8).reverse(),
)
const running = computed(() => session.jobs.value.find(j => j.state === 'running') ?? null)
const busy = computed(() => active.value.length > 0)

function duration(job) {
  const end = job.finishedAt ?? now.value
  if (!job.startedAt) return ''
  return `${((end - job.startedAt) / 1000).toFixed(1)}s`
}

function countdown(task) {
  if (task.running) return 'running'
  if (!task.nextRunAt) return 'idle'
  const left = Math.max(0, task.nextRunAt - now.value)
  return left > 1000 ? `in ${Math.round(left / 1000)}s` : 'now'
}

function label(job) {
  const p = job.params ?? {}
  const detail = p.key ?? p.from ?? p.source ?? ''
  return detail ? `${job.action} · ${String(detail).split('/').pop()}` : job.action
}
</script>

<template>
  <div class="queue-panel">
    <button
      class="toggle-btn"
      :class="{ busy }"
      title="Job queue"
      @click="open = !open"
    >
      <i :class="running ? 'fas fa-circle-notch fa-spin' : 'fas fa-list-ul'" />
      <span
        v-if="session.pending.value > 0"
        class="badge"
      >{{ session.pending.value }}</span>
    </button>

    <div
      v-if="open"
      class="panel"
    >
      <p class="section">
        Queue
      </p>

      <p
        v-if="active.length === 0"
        class="empty"
      >
        idle
      </p>
      <ul
        v-else
        class="jobs"
      >
        <li
          v-for="job in active"
          :key="job.id"
          :class="job.state"
        >
          <span class="dot" />
          <span class="name">{{ label(job) }}</span>
          <span class="meta">{{ job.state === 'running' ? duration(job) : 'queued' }}</span>
          <button
            v-if="job.state === 'queued'"
            class="cancel"
            title="Cancel"
            @click="session.cancelJob(job.id)"
          >
            ×
          </button>
        </li>
      </ul>

      <p class="section">
        Scheduler
      </p>
      <ul class="tasks">
        <li
          v-for="task in session.tasks.value"
          :key="task.name"
          :class="{ erred: task.lastError }"
        >
          <span class="name">{{ task.name }}</span>
          <span class="meta">{{ countdown(task) }}</span>
          <span class="runs">{{ task.runs }}×</span>
        </li>
      </ul>

      <template v-if="history.length">
        <p class="section">
          Recent
        </p>
        <ul class="jobs history">
          <li
            v-for="job in history"
            :key="job.id"
            :class="job.state"
          >
            <span class="dot" />
            <span class="name">{{ label(job) }}</span>
            <span class="meta">{{ job.error ? job.error : duration(job) }}</span>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.queue-panel {
  /* Sized to the button only: this is anchored by `right`, so letting the
     open panel set the width dragged the button leftward. */
  width: 36px;
  height: 36px;
  position: fixed;
  top: 16px;
  right: 64px;
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
.toggle-btn.busy  { background: rgba(120, 200, 255, 0.35); }

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #4aa3ff;
  color: #000;
  font-size: 10px;
  line-height: 16px;
  font-weight: bold;
}

.panel {
  position: absolute;
  top: 44px;
  right: 0;

  width: 280px;
  max-height: 60vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px 12px;
}

.section {
  margin: 8px 0 4px;
  color: #888;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.section:first-child { margin-top: 0; }

.empty { color: #555; font-size: 11px; margin: 0; }

ul { list-style: none; margin: 0; padding: 0; }

li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  color: #ddd;
  font-size: 11px;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta { color: #888; font-size: 10px; flex-shrink: 0; }
.runs { color: #555; font-size: 10px; min-width: 24px; text-align: right; }

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
  flex-shrink: 0;
}

li.running .dot   { background: #4aa3ff; }
li.done .dot      { background: #4c4; }
li.failed .dot    { background: #f55; }
li.cancelled .dot { background: #444; }

li.failed .meta   { color: #f88; }
li.cancelled .name { color: #666; text-decoration: line-through; }
li.erred .meta    { color: #f88; }

.history li { opacity: 0.65; }

.cancel {
  border: none;
  background: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.cancel:hover { color: #f55; }
</style>
