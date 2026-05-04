<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const emit = defineEmits(['resolve', 'reject'])

let timer = null
let resolved = false

function resolve() {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  emit('resolve')
}

onMounted(() => {
  resolved = false
  const duration = props.data.duration ?? 2000
  timer = setTimeout(resolve, duration)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div class="player image-player" @click="resolve">
    <img :src="data.src" :alt="data.FileName" />
  </div>
</template>

<style scoped>
.image-player {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: pointer;
}

img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
