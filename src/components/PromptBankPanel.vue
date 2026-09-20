<script setup>
import { ref, watch } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)
const prompts = ref([])
const draft = ref('')
const busy = ref(false)

async function refresh() {
  busy.value = true
  const res = await session.request('prompt', { op: 'list' })
  prompts.value = res.prompts ?? []
  busy.value = false
}

watch(open, (isOpen) => { if (isOpen) refresh() })

async function add() {
  if (!draft.value.trim()) return
  await session.request('prompt', { op: 'add', text: draft.value.trim() })
  draft.value = ''
  await refresh()
}

async function toggle(p) {
  await session.request('prompt', { op: 'update', id: p.id, enabled: !p.enabled })
  await refresh()
}

async function remove(p) {
  await session.request('prompt', { op: 'remove', id: p.id })
  await refresh()
}

async function seed() {
  await session.request('prompt', { op: 'seed' })
  await refresh()
}
</script>

<template>
  <div class="bank-panel">
    <button
      class="toggle-btn"
      title="Prompt bank"
      @click="open = !open"
    >
      <i class="fas fa-pen-nib" />
    </button>

    <div
      v-if="open"
      class="panel"
    >
      <p class="section">
        Prompt bank
        <button
          class="mini"
          title="Load starter prompts"
          @click="seed"
        >
          seed
        </button>
      </p>

      <div class="add">
        <input
          v-model="draft"
          class="input"
          placeholder="add a broad prompt…"
          @keyup.enter="add"
        >
        <button
          class="mini"
          @click="add"
        >
          +
        </button>
      </div>

      <p
        v-if="busy && prompts.length === 0"
        class="empty"
      >
        loading…
      </p>
      <p
        v-else-if="prompts.length === 0"
        class="empty"
      >
        empty — try “seed”
      </p>

      <ul
        v-else
        class="list"
      >
        <li
          v-for="p in prompts"
          :key="p.id"
          :class="{ off: p.enabled === false }"
        >
          <button
            class="dot"
            :title="p.enabled === false ? 'disabled' : 'enabled'"
            @click="toggle(p)"
          />
          <span class="text">{{ p.text }}</span>
          <button
            class="del"
            title="Remove"
            @click="remove(p)"
          >
            ×
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bank-panel {
  width: 36px; height: 36px;
  position: fixed; top: 16px; right: 208px;
  z-index: 10; font-family: monospace;
}
.toggle-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: rgba(255, 255, 255, 0.15); color: #fff; font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.toggle-btn:hover { background: rgba(255, 255, 255, 0.3); }
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
  display: flex; justify-content: space-between; align-items: center;
}
.add { display: flex; gap: 4px; margin-bottom: 8px; }
.input {
  flex: 1; background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px;
  color: #ddd; font-family: monospace; font-size: 11px; padding: 5px 6px;
}
.mini {
  border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.15);
  color: #fff; cursor: pointer; font-size: 11px; padding: 2px 8px;
}
.mini:hover { background: rgba(255, 255, 255, 0.3); }
.empty { color: #666; font-size: 11px; margin: 4px 0; }
.list { list-style: none; margin: 0; padding: 0; }
li { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 11px; color: #ddd; }
li.off .text { color: #666; text-decoration: line-through; }
.dot { width: 8px; height: 8px; border-radius: 50%; border: none; background: #4c4; cursor: pointer; flex-shrink: 0; }
li.off .dot { background: #555; }
.text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.del { border: none; background: none; color: #888; cursor: pointer; font-size: 14px; }
.del:hover { color: #f55; }
</style>
