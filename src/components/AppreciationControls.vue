<script setup>
const emit = defineEmits(['like', 'dislike', 'skip'])
</script>

<template>
  <div class="appreciation-controls">
    <button class="btn btn-like" title="Like" @click="emit('like')">
      <i class="fas fa-thumbs-up" />
    </button>
    <button class="btn btn-skip" title="Skip" @click="emit('skip')">
      <i class="fas fa-forward" />
    </button>
    <button class="btn btn-dislike" title="Dislike" @click="emit('dislike')">
      <i class="fas fa-thumbs-down" />
    </button>
  </div>
</template>

<style scoped>
.appreciation-controls {
  position: fixed;
  bottom: 48px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.appreciation-controls:hover,
.appreciation-controls:focus-within {
  opacity: 1;
}

.btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.btn-like:hover { background: rgba(80, 200, 80, 0.5); }
.btn-dislike:hover { background: rgba(200, 80, 80, 0.5); }
</style>
