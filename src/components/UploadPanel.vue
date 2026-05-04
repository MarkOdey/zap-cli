<script setup>
import { ref } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const open = ref(false)
const textContent = ref('')
const status = ref('')

function triggerExplore() {
  session.explore()
  status.value = 'Exploring…'
  const stop = setInterval(() => {
    if (!session.exploring.value) {
      status.value = 'Library indexed.'
      clearInterval(stop)
    }
  }, 500)
}

function toggle() {
  open.value = !open.value
  status.value = ''
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    session.upload({ name: file.name, type: file.type }, e.target.result)
    status.value = `Uploaded: ${file.name}`
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

function submitText() {
  const content = textContent.value.trim()
  if (!content) return
  session.upload({ name: 'text-' + Date.now() + '.txt', type: 'text/plain' }, content)
  status.value = 'Text uploaded.'
  textContent.value = ''
}
</script>

<template>
  <div class="upload-panel">
    <button class="toggle-btn" title="Upload" @click="toggle">
      <i class="fas fa-upload" />
    </button>

    <div v-if="open" class="upload-form">
      <label class="form-label">
        Video / Image
        <input type="file" accept="video/*,image/*" @change="onFileChange" />
      </label>

      <label class="form-label">
        Text
        <textarea v-model="textContent" rows="3" placeholder="Enter text..." />
      </label>
      <button class="submit-btn" @click="submitText">Submit text</button>

      <button
        class="submit-btn explore-btn"
        :disabled="session.exploring.value"
        @click="triggerExplore"
      >
        <i class="fas fa-search" />
        {{ session.exploring.value ? 'Indexing…' : 'Explore library' }}
      </button>

      <p v-if="status" class="status">{{ status }}</p>
    </div>
  </div>
</template>

<style scoped>
.upload-panel {
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
  margin-top: 8px;
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
</style>
