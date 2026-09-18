<script setup>
import { onUnmounted, ref } from 'vue'

const emit = defineEmits(['like', 'dislike', 'skip'])

/**
 * Which button was last pressed, cleared shortly after.
 *
 * Liking and disliking change a weight in the database and nothing on screen, so
 * without this the controls give no sign of having worked at all.
 */
const flashed = ref(null)
let timer = null

function press(action) {
  emit(action)
  flashed.value = action
  clearTimeout(timer)
  timer = setTimeout(() => { flashed.value = null }, 450)
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="appreciation-controls">
    <button
      class="btn btn-like"
      :class="{ flash: flashed === 'like' }"
      title="Like"
      @click="press('like')"
    >
      <i class="fas fa-thumbs-up" />
    </button>
    <button
      class="btn btn-skip"
      :class="{ flash: flashed === 'skip' }"
      title="Skip"
      @click="press('skip')"
    >
      <i class="fas fa-forward" />
    </button>
    <button
      class="btn btn-dislike"
      :class="{ flash: flashed === 'dislike' }"
      title="Dislike — lowers its weight and moves on"
      @click="press('dislike')"
    >
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

/* Confirmation that the press registered — the effect is otherwise invisible. */
.btn.flash {
  transform: scale(1.18);
  transition: transform 0.12s ease-out, background 0.12s;
}

.btn-like.flash { background: rgba(80, 200, 80, 0.85); }
.btn-dislike.flash { background: rgba(200, 80, 80, 0.85); }
.btn-skip.flash { background: rgba(255, 255, 255, 0.55); }
</style>
