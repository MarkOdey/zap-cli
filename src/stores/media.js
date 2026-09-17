import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useMediaStore = defineStore("media", () => {
  const currentMedia = ref(null);
  const playbackState = ref("idle"); // 'idle' | 'playing' | 'done'

  const mediaType = computed(() => {
    if (!currentMedia.value) return null;

    const fileType = currentMedia.value.type ?? "";
    if (fileType.includes("video")) return "video";
    if (fileType.includes("image")) return "image";
    if (fileType.includes("audio")) return "audio";
    if (fileType.includes("text")) return "text";

    // No player means nothing emits resolve/reject, which parks the loop — so an
    // unmapped type is worth shouting about.
    console.warn("no player for type", fileType, currentMedia.value.key);
    return null;
  });

  function setMedia(doc) {
    currentMedia.value = doc;
    playbackState.value = "playing";
  }

  function markDone() {
    playbackState.value = "done";
  }

  function clear() {
    currentMedia.value = null;
    playbackState.value = "idle";
  }

  return { currentMedia, playbackState, mediaType, setMedia, markDone, clear };
});
