<script setup>
import { computed, ref, watch } from 'vue'
import { useSession } from '../composables/useSession'
import { useMediaStore } from '../stores/media'

const session = useSession()
const mediaStore = useMediaStore()

const open = ref(false)
const items = ref([])
const total = ref(0)
const skip = ref(0)
const limit = ref(25)
const sort = ref('name')
const order = ref(1)
const search = ref('')
const typeFilter = ref('')
const loading = ref(false)

const page = computed(() => Math.floor(skip.value / limit.value) + 1)
const pages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))
const playingKey = computed(() => mediaStore.currentMedia?.key ?? null)

async function load() {
  loading.value = true
  const res = await session.fetchList({
    skip: skip.value,
    limit: limit.value,
    sort: sort.value,
    order: order.value,
    search: search.value || undefined,
    type: typeFilter.value || undefined,
  })
  loading.value = false
  if (res.error) return
  items.value = res.items
  total.value = res.total
}

function toggle() {
  open.value = !open.value
  if (open.value) load()
}

function go(delta) {
  const next = skip.value + delta * limit.value
  if (next < 0 || next >= total.value) return
  skip.value = next
  load()
}

function setSort(field) {
  if (sort.value === field) order.value = -order.value
  else { sort.value = field; order.value = 1 }
  skip.value = 0
  load()
}

// Reset to the first page whenever a filter changes.
let debounce
watch([search, typeFilter], () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { skip.value = 0; load() }, 250)
})

// Keep the list honest while the loop advances on its own.
watch(playingKey, () => { if (open.value) load() })

const kind = (type) => (type || '').split('/')[0] || '?'
const icon = (type) => ({
  video: 'fa-film', image: 'fa-image', audio: 'fa-music', text: 'fa-align-left',
}[kind(type)] ?? 'fa-file')
</script>

<template>
  <div class="media-list">
    <button
      class="toggle-btn"
      title="Library"
      @click="toggle"
    >
      <i class="fas fa-th-list" />
    </button>

    <div
      v-if="open"
      class="panel"
    >
      <div class="controls">
        <input
          v-model="search"
          class="search"
          type="text"
          placeholder="filter by name…"
        >
        <select
          v-model="typeFilter"
          class="type"
        >
          <option value="">
            all
          </option>
          <option value="image">
            image
          </option>
          <option value="video">
            video
          </option>
          <option value="audio">
            audio
          </option>
          <option value="text">
            text
          </option>
        </select>
      </div>

      <div class="head">
        <button
          class="sort"
          :class="{ active: sort === 'name' }"
          @click="setSort('name')"
        >
          name <i
            v-if="sort === 'name'"
            :class="order === 1 ? 'fas fa-caret-up' : 'fas fa-caret-down'"
          />
        </button>
        <button
          class="sort"
          :class="{ active: sort === 'type' }"
          @click="setSort('type')"
        >
          type
        </button>
        <button
          class="sort w"
          :class="{ active: sort === 'weight' }"
          @click="setSort('weight')"
        >
          wt
        </button>
        <button
          class="sort d"
          :class="{ active: sort === 'date' }"
          @click="setSort('date')"
        >
          age <i
            v-if="sort === 'date'"
            :class="order === 1 ? 'fas fa-caret-up' : 'fas fa-caret-down'"
          />
        </button>
      </div>

      <p
        v-if="loading"
        class="note"
      >
        loading…
      </p>
      <p
        v-else-if="items.length === 0"
        class="note"
      >
        nothing matches
      </p>

      <ul
        v-else
        class="rows"
      >
        <li
          v-for="item in items"
          :key="item.key"
          :class="{ playing: item.key === playingKey, derived: !!item.generator }"
          :title="item.key"
          @click="session.playKey(item.key)"
        >
          <i
            class="fas"
            :class="icon(item.type)"
          />
          <span class="name">{{ item.name }}</span>
          <span class="type">{{ kind(item.type) }}</span>
          <span class="wt">{{ item.weight?.toFixed(2) }}</span>
          <span
            class="date"
            :title="item.addedAt"
          >{{ age(item.addedAt) }}</span>
        </li>
      </ul>

      <div class="pager">
        <button
          :disabled="skip === 0"
          @click="go(-1)"
        >
          <i class="fas fa-chevron-left" />
        </button>
        <span>{{ page }} / {{ pages }} · {{ total }} items</span>
        <button
          :disabled="skip + limit >= total"
          @click="go(1)"
        >
          <i class="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-list {
  /* Sized to the button only: this is anchored by `right`, so letting the
     open panel set the width dragged the button leftward. */
  width: 36px;
  height: 36px;
  position: fixed;
  top: 16px;
  right: 112px;
  z-index: 10;
  font-family: monospace;
}

.toggle-btn {
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

.panel {
  position: absolute;
  top: 44px;
  right: 0;

  width: 340px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px;
}

.controls { display: flex; gap: 6px; margin-bottom: 8px; }

.search, .type {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  padding: 4px 6px;
}
.search { flex: 1; min-width: 0; }
.type { cursor: pointer; }
.type option { background: #111; }

.head {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.sort {
  background: none;
  border: none;
  color: #777;
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  padding: 0;
}
.sort:first-child { flex: 1; text-align: left; }
.sort.active { color: #ccc; }
.sort.w { width: 34px; text-align: right; }

.rows { list-style: none; margin: 0; padding: 0; max-height: 46vh; overflow-y: auto; }

.rows li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px;
  color: #ddd;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}
.rows li:hover { background: rgba(255, 255, 255, 0.08); }
.rows li.playing { background: rgba(74, 163, 255, 0.22); color: #fff; }
.rows li.derived .name { color: #b9a; font-style: italic; }

.rows li > i { color: #666; width: 12px; flex-shrink: 0; }
.rows li.playing > i { color: #4aa3ff; }

.name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type { color: #777; font-size: 10px; }
.wt { color: #777; font-size: 10px; width: 34px; text-align: right; }

.note { color: #666; font-size: 11px; margin: 8px 0; text-align: center; }

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #777;
  font-size: 10px;
}

.pager button {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 3px;
  color: #fff;
  cursor: pointer;
  font-size: 10px;
  padding: 3px 8px;
}
.pager button:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
