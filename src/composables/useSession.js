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
const uploadResult = ref(null); // { ok, name?, segments?, error? }

/** Batch progress while several files are being sent, or null when idle. */
const uploadProgress = ref(null); // { done, total, current, failures: [] }

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

/**
 * Last resort against a player that never resolves.
 *
 * Every player has its own guards, but they only cover the failures anticipated:
 * a keyed component that never remounts, an event that never fires, a browser that
 * refuses something silently. If nothing has advanced well past what an item
 * should take, skip it rather than sit there — a wrong skip is recoverable, a
 * stall is not.
 */
const STALL_LIMIT_MS = {
  image: 60_000,
  text: 60_000,
  audio: 20 * 60_000,
  video: 20 * 60_000,
};

let watchdog = null;

function armWatchdog(media) {
  clearTimeout(watchdog);

  const kind = String(media?.type ?? "").split("/")[0];
  const limit = STALL_LIMIT_MS[kind];
  if (!limit) return;

  watchdog = setTimeout(() => {
    console.warn(`playback stalled on ${media?.key} after ${limit / 1000}s — skipping`);
    socket?.emit("reject");
  }, limit);
}

function disarmWatchdog() {
  clearTimeout(watchdog);
  watchdog = null;
}

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
      armWatchdog(data);
      // The server sends a relative /media/:key path now, not base64. Resolve it
      // against the API origin so players can use it as an ordinary src.

      console.log('Play', data);
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
    disarmWatchdog();
    mediaStore.markDone();
    socket?.emit("resolve");
  }

  function reject() {
    disarmWatchdog();
    mediaStore.clear();
    socket?.emit("reject");
  }

  function pause() {
    paused.value = true;
    // A paused player is not a stalled one.
    disarmWatchdog();
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
  /** Delete a library item. Resolves with the server's reply. */
  function removeMedia(key, { cascade = false } = {}) {
    return new Promise((resolve) => {
      if (!socket || !key) return resolve({ error: "not connected" });
      socket.emit("run", JSON.stringify({ action: "remove", params: { key, cascade } }));
      const onDone = (r) => { if (r.action === "remove") { cleanup(); resolve(r.result ?? {}); } };
      const onError = (r) => { if (r.action === "remove") { cleanup(); resolve({ error: r.error }); } };
      function cleanup() {
        socket.off("run:done", onDone);
        socket.off("run:error", onError);
      }
      socket.on("run:done", onDone);
      socket.on("run:error", onError);
    });
  }

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

  /** Send one file. Resolves with {ok, name, segments?, error?}. */
  function upload(meta, data) {
    uploadResult.value = null;
    return new Promise((resolve) => {
      if (!socket) return resolve({ ok: false, name: meta?.name, error: "not connected" });
      socket.emit("upload", { meta, data }, resolve);
    });
  }

  /**
   * Send several files one after another.
   *
   * Sequential on purpose: each file crosses the socket as base64, so a handful of
   * videos sent at once would hold hundreds of megabytes in memory at both ends.
   */
  async function uploadAll(files, read) {
    const list = [...files];
    uploadProgress.value = { done: 0, total: list.length, current: null, failures: [] };

    for (const file of list) {
      uploadProgress.value = { ...uploadProgress.value, current: file.name };
      try {
        const payload = await read(file);
        const result = await upload({ name: file.name, type: file.type }, payload);
        if (!result.ok) {
          uploadProgress.value.failures.push({ name: file.name, error: result.error });
        }
      } catch (err) {
        uploadProgress.value.failures.push({ name: file.name, error: err?.message ?? "could not read file" });
      }
      uploadProgress.value = { ...uploadProgress.value, done: uploadProgress.value.done + 1 };
    }

    const summary = { ...uploadProgress.value, current: null };
    uploadProgress.value = summary;
    return summary;
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
    uploadAll,
    uploadResult,
    uploadProgress,
    enqueue,
    cancelJob,
    fetchList,
    playKey,
    removeMedia,
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
