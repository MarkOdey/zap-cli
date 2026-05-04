<script setup>
import { ref } from 'vue'
import { useSession } from '../composables/useSession'

const session = useSession()
const input = ref('')

function submit() {
  const cmd = input.value.trim()
  if (cmd) session.run(cmd)
  input.value = ''
}
</script>

<template>
  <input
    v-model="input"
    class="terminal-input"
    type="text"
    placeholder="command..."
    @keydown.enter="submit"
  />
</template>

<style scoped>
.terminal-input {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  padding: 8px;
  font-family: monospace;
  font-size: 14px;
  outline: none;
  z-index: 10;
}
</style>
