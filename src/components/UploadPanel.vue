<script setup>
import { computed, ref } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)
const textContent = ref('')
const status = ref('')

/** Read a File as a data URL, which is what the upload action expects. */
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(`could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function onFileChange(event) {
  const files = [...event.target.files]
  if (files.length === 0) return

  // Clear the input now so the same selection can be chosen again afterwards.
  event.target.value = ''
  status.value = ''

  const summary = await session.uploadAll(files, readAsDataUrl)

  const failed = summary.failures.length
  const sent = summary.total - failed
  status.value = failed
    ? `${sent} of ${summary.total} uploaded — ${summary.failures.map(f => f.name).join(', ')} failed`
    : `${sent} file${sent === 1 ? '' : 's'} uploaded`
}

const progress = computed(() => {
  const p = session.uploadProgress.value
  if (!p || p.done >= p.total) return null
  return p.total === 1
    ? `Uploading ${p.current ?? ''}…`
    : `Uploading ${p.done + 1} of ${p.total}${p.current ? ` — ${p.current}` : ''}`
})

const uploadStatus = computed(() => {
  if (progress.value) return { text: progress.value, ok: null }
  const p = session.uploadProgress.value
  if (p && p.total > 0 && p.done >= p.total) {
    return p.failures.length
      ? { text: `${p.failures.length} of ${p.total} failed`, ok: false }
      : null
  }
  const r = session.uploadResult.value
  if (!r) return null
  if (r.ok) return { text: `Done — ${r.segments} segment${r.segments !== 1 ? 's' : ''} indexed`, ok: true }
  return { text: `Upload failed: ${r.error}`, ok: false }
})

function triggerExplore() {
  // The queue panel reports progress now — no polling needed.
  session.explore()
  status.value = 'Queued.'
}

function toggle() {
  open.value = !open.value
  status.value = ''
}

async function submitText() {
  const content = textContent.value.trim()
  if (!content) return
  textContent.value = ''
  const result = await session.upload({ name: `text-${Date.now()}.txt`, type: 'text/plain' }, content)
  status.value = result.ok ? 'Text uploaded.' : `Text upload failed: ${result.error}`
}
</script>

<template>
  <div class="upload-panel">
    <button
      class="toggle-btn"
      title="Upload"
      @click="toggle"
    >
      <i class="fas fa-upload" />
    </button>

    <div
      v-if="open"
      class="upload-form"
    >
      <label class="form-label">
        Files — pick several at once
        <input
          type="file"
          multiple
          accept="video/*,image/*,audio/*,text/plain,.txt,.md"
          @change="onFileChange"
        >
      </label>

      <label class="form-label">
        Write text
        <textarea
          v-model="textContent"
          rows="3"
          placeholder="Enter text..."
        />
      </label>
      <button
        class="submit-btn"
        @click="submitText"
      >
        Submit text
      </button>

      <button
        class="submit-btn explore-btn"
        :disabled="session.exploring.value"
        @click="triggerExplore"
      >
        <i class="fas fa-search" />
        {{ session.exploring.value ? 'Indexing…' : 'Explore library' }}
      </button>

      <p
        v-if="status"
        class="status"
      >
        {{ status }}
      </p>
      <p
        v-if="uploadStatus"
        class="status"
        :class="{ error: uploadStatus.ok === false }"
      >
        {{ uploadStatus.text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.upload-panel {
  /* Sized to the button only: this is anchored by `right`, so letting the
     open panel set the width dragged the button leftward. */
  width: 36px;
  height: 36px;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
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

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.upload-form {
  position: absolute;
  top: 44px;
  right: 0;

  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #ccc;
  font-family: monospace;
  font-size: 12px;
}

input[type="file"],
textarea {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  padding: 4px;
}

textarea {
  resize: vertical;
}

.submit-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  padding: 6px;
  cursor: pointer;
}

.submit-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.explore-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.explore-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  color: #8f8;
  font-family: monospace;
  font-size: 11px;
  margin: 0;
}

.status.error {
  color: #f88;
}
</style>
