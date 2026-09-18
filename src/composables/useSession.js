import { io } from "socket.io-client";
import { ref } from "vue";
import { useMediaStore } from "../stores/media";

let socket = null;
let apiOrigin = "http://localhost:3000/";

/** Turn the server's relative media path into a URL the browser can fetch. */
function resolveMedia(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  try {
    return new URL(src, apiOrigin).href;
  } catch {
    return src;
  }
}
const paused = ref(false);
const exploring = ref(false);
const uploadResult = ref(null); // { ok, segments?, error? }

// Queue + scheduler state, shared by every component that calls useSession().
const jobs = ref([]);
const tasks = ref([]);
const pending = ref(0);
const commands = ref([]);

/**
 * Whether sound is on. Browsers refuse to autoplay audible media until the page
 * has been interacted with, so players start muted when that refusal happens and
 * this lets the user turn it back on with the gesture that unblocks it.
 */
const soundOn = ref(readSoundPreference());

function readSoundPreference() {
  try {
    return window.localStorage.getItem("zap:sound") !== "off";
  } catch {
    return true;
  }
}

function setSound(on) {
  soundOn.value = on;
  try {
    window.localStorage.setItem("zap:sound", on ? "on" : "off");
  } catch { /* private mode; the ref still works for this session */ }
}
const runLog = ref([]);

const LOG_LIMIT = 100;
function log(entry) {
  runLog.value = [...runLog.value, { ...entry, at: Date.now() }].slice(-LOG_LIMIT);
}

export function useSession() {
  const mediaStore = useMediaStore();

  function connect(url = "http://localhost:3000/") {
    apiOrigin = url;
    socket = io(url);

    socket.on("connected", () => {
      console.log("connected to zap-api");
    });

    socket.on("play", (data) => {
      // The server sends a relative /media/:key path now, not base64. Resolve it
      // against the API origin so players can use it as an ordinary src.
      mediaStore.setMedia({ ...data, src: resolveMedia(data.src) });
    });

    socket.on("connect_error", (err) => {
      console.warn("socket connection error:", err);
    });

    socket.on("commands", (list) => {
      commands.value = list;
    });

    socket.on("run:done", ({ action, result }) => {
      log({ kind: "done", action, result });
    });

    socket.on("run:error", ({ action, error }) => {
      log({ kind: "error", action, error });
    });

    socket.on("run:queued", ({ action, id }) => {
      log({ kind: "queued", action, id });
    });

    socket.on("queue:state", (state) => {
      jobs.value = state.jobs ?? [];
      tasks.value = state.tasks ?? [];
      pending.value = state.pending ?? 0;
      exploring.value = hasActiveExplore(jobs.value);
    });

    socket.on("queue:update", ({ job, pending: n, tasks: t }) => {
      const i = jobs.value.findIndex((j) => j.id === job.id);
      if (i === -1) jobs.value = [...jobs.value, job];
      else jobs.value = jobs.value.map((j) => (j.id === job.id ? job : j));

      pending.value = n ?? pending.value;
      if (t) tasks.value = t;
      exploring.value = hasActiveExplore(jobs.value);
    });

    // Slow heartbeat so the "next run" countdowns stay honest between jobs.
    socket.on("queue:tasks", (t) => {
      tasks.value = t;
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
    return enqueue("explore");
  }

  /** Push a job. Resolves with {ok, id} or {ok:false, error}. */
  function enqueue(action, params = {}) {
    return new Promise((resolve) => {
      if (!socket) return resolve({ ok: false, error: "not connected" });
      socket.emit("queue:push", { action, params }, resolve);
    });
  }

  function cancelJob(id) {
    socket?.emit("queue:cancel", { id });
  }

  /** Fetch a page of the library. Resolves with {items, total, skip, limit}. */
  function fetchList(params = {}) {
    return new Promise((resolve) => {
      if (!socket) return resolve({ items: [], total: 0, error: "not connected" });
      socket.emit("list", params, resolve);
    });
  }

  /**
   * Play a specific item now. The server parks the loop awaiting resolve/reject
   * inside play(), so the reject is what ends the current item and lets the
   * forced key take effect on the next cycle.
   */
  function playKey(key) {
    if (!socket || !key) return;
    socket.emit("playKey", { key });
    socket.emit("reject");
  }

  /** Send a parsed command. Params are optional for actions that take none. */
  function run(action, params = {}) {
    log({ kind: "sent", action, params });
    socket?.emit("run", JSON.stringify({ action, params }));
  }

  function logLocal(entry) {
    log(entry);
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
    enqueue,
    cancelJob,
    fetchList,
    playKey,
    jobs,
    tasks,
    pending,
    commands,
    runLog,
    logLocal,
    soundOn,
    setSound,
  };
}

const ACTIVE = ["queued", "running"];
const hasActiveExplore = (list) =>
  list.some((j) => j.action === "explore" && ACTIVE.includes(j.state));
