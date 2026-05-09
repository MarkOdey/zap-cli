import { io } from "socket.io-client";
import { ref } from "vue";
import { useMediaStore } from "../stores/media";

let socket = null;
const paused = ref(false);
const exploring = ref(false);
const uploadResult = ref(null); // { ok, segments?, error? }

export function useSession() {
  const mediaStore = useMediaStore();

  function connect(url = "http://localhost:3000/") {
    socket = io(url);

    socket.on("connected", () => {
      console.log("connected to zap-api");
    });

    socket.on("play", (data) => {
      console.log("play", data);
      mediaStore.setMedia(data);
    });

    socket.on("connect_error", (err) => {
      console.warn("socket connection error:", err);
    });

    socket.on("explored", () => {
      exploring.value = false;
    });

    socket.on("upload:done", (result) => {
      uploadResult.value = result;
    });
  }

  function resolve() {
    mediaStore.markDone();
    socket?.emit("resolve");
  }

  function reject() {
    mediaStore.clear();
    socket?.emit("reject");
  }

  function pause() {
    paused.value = true;
    socket?.emit("pause");
  }

  function play() {
    paused.value = false;
    socket?.emit("play");
  }

  function togglePlayPause() {
    paused.value ? play() : pause();
  }

  function explore() {
    if (exploring.value) return;
    exploring.value = true;
    socket?.emit("explore");
  }

  function run(cmd) {
    socket?.emit("run", JSON.stringify({ action: cmd }));
  }

  function like() {
    socket?.emit("like");
  }

  function dislike() {
    socket?.emit("dislike");
  }

  function upload(meta, data) {
    console.log("upload the file!!");
    uploadResult.value = null;
    socket?.emit("upload", { meta, data });
  }

  return {
    connect,
    resolve,
    reject,
    like,
    dislike,
    pause,
    play,
    togglePlayPause,
    paused,
    explore,
    exploring,
    run,
    upload,
    uploadResult,
  };
}
