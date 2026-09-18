<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useSession } from '../composables/useSession'
import { applySuggestion, parseCommand, suggest, tokenize, usage } from '../scripts/command.js'

const session = useSession()

const input = ref('')
const inputEl = ref(null)
const outputEl = ref(null)
const showOutput = ref(false)
const selected = ref(0)

const history = ref([])
let historyIndex = -1

const completion = computed(() => suggest(input.value, session.commands.value))
const open = computed(() => completion.value.items.length > 0 && input.value.length > 0)

/** Usage hint for the action currently being typed. */
const hint = computed(() => {
  const name = tokenize(input.value)[0]
  if (!name) return ''
  const spec = session.commands.value.find(c => c.name === name)
  return spec ? usage(spec) : ''
})

watch(completion, () => { selected.value = 0 })

watch(() => session.runLog.value.length, async () => {
  if (!showOutput.value) showOutput.value = true
  await nextTick()
  if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
})

function accept(index = selected.value) {
  const { items, replace } = completion.value
  const choice = items[index]
  if (!choice) return
  input.value = applySuggestion(input.value, replace, choice)
  inputEl.value?.focus()
}

function submit() {
  const line = input.value.trim()
  if (!line) return

  // A visible dropdown means Enter is choosing a completion, not running.
  if (open.value) return accept()

  const parsed = parseCommand(line, session.commands.value)
  if (parsed.error) {
    session.logLocal({ kind: 'error', action: line, error: parsed.error })
  } else {
    session.run(parsed.action, parsed.params)
  }

  history.value = [...history.value, line].slice(-50)
  historyIndex = -1
  input.value = ''
  showOutput.value = true
}

function onArrow(direction) {
  // Arrows move through the dropdown when it is open, history otherwise.
  if (open.value) {
    const n = completion.value.items.length
    selected.value = (selected.value + direction + n) % n
    return
  }

  if (history.value.length === 0) return
  if (historyIndex === -1) historyIndex = history.value.length
  historyIndex = Math.min(history.value.length, Math.max(0, historyIndex + direction))
  input.value = historyIndex === history.value.length ? '' : history.value[historyIndex]
}

function onEscape() {
  if (open.value) input.value = input.value.replace(/\S*$/, '')
  else showOutput.value = false
}

function summarize(entry) {
  if (entry.kind === 'sent') {
    const args = Object.entries(entry.params ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join(' ')
    return `${entry.action}${args ? ' ' + args : ''}`
  }
  if (entry.kind === 'queued') return `${entry.action} queued`
  if (entry.kind === 'error') return `${entry.action}: ${entry.error}`
  if (entry.result === null || entry.result === undefined) return `${entry.action} ok`

  // Actions that produce readable output — help, notably — return `lines`.
  if (Array.isArray(entry.result?.lines)) return entry.result.lines.join('\n')

  if (typeof entry.result === 'object') return `${entry.action} → ${JSON.stringify(entry.result, null, 0)}`
  return `${entry.action} → ${entry.result}`
}

const prefix = { sent: '$', done: '→', error: '!', queued: '⋯' }
</script>

<template>
  <div class="terminal">
    <div
      v-if="showOutput && session.runLog.value.length"
      ref="outputEl"
      class="output"
    >
      <p
        v-for="(entry, i) in session.runLog.value"
        :key="i"
        :class="entry.kind"
      >
        <span class="prefix">{{ prefix[entry.kind] }}</span>{{ summarize(entry) }}
      </p>
    </div>

    <ul
      v-if="open"
      class="suggestions"
    >
      <li
        v-for="(item, i) in completion.items"
        :key="item"
        :class="{ active: i === selected }"
        @mousedown.prevent="accept(i)"
      >
        {{ item }}
      </li>
    </ul>

    <div class="bar">
      <span class="sigil">$</span>
      <input
        ref="inputEl"
        v-model="input"
        class="input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :placeholder="session.commands.value.length ? 'command… (Tab to complete)' : 'connecting…'"
        @keydown.enter.prevent="submit"
        @keydown.tab.prevent="accept()"
        @keydown.down.prevent="onArrow(1)"
        @keydown.up.prevent="onArrow(-1)"
        @keydown.esc.prevent="onEscape"
      >
      <span
        v-if="hint"
        class="hint"
      >{{ hint }}</span>
      <button
        v-if="session.runLog.value.length"
        class="toggle"
        :title="showOutput ? 'Hide output' : 'Show output'"
        @click="showOutput = !showOutput"
      >
        <i :class="showOutput ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.terminal {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 11;
  font-family: monospace;
  font-size: 12px;
}

.output {
  max-height: 30vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 10px;
}

.output p {
  margin: 0;
  padding: 1px 0;
  color: #bbb;
  white-space: pre-wrap;
  word-break: break-word;
  font-variant-ligatures: none;
}

.output p.sent   { color: #888; }
.output p.done   { color: #8d8; }
.output p.error  { color: #f88; }
.output p.queued { color: #7bf; }

.prefix {
  display: inline-block;
  width: 14px;
  color: #555;
}

.suggestions {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 32vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.94);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.suggestions li {
  padding: 3px 10px 3px 24px;
  color: #ccc;
  cursor: pointer;
}

.suggestions li.active,
.suggestions li:hover {
  background: rgba(74, 163, 255, 0.28);
  color: #fff;
}

.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px 10px;
}

.sigil { color: #4aa3ff; }

.input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  color: #fff;
  font-family: monospace;
  font-size: 13px;
  outline: none;
}

.hint {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 45%;
}

.toggle {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  padding: 0 2px;
}
.toggle:hover { color: #ccc; }
</style>
