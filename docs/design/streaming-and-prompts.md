# Design (client): Live streaming & agent-built prompts

Status: **proposal, awaiting sign-off** · No code has been written yet.
This is the `zap-cli` (Vue client) surface for two features. The authoritative,
engine-side design lives in **`zap-api/docs/design/streaming-and-prompts.md`** —
read that first; this covers only what changes in the browser client.

Decisions taken: generic RTMP (YouTube-ready) for streaming; a **local LLM agent
(Ollama)** generates broad open-ended prompts server-side, with a **runtime-
editable prompt bank** the client manages (the bank is fallback + your own pinned
prompts). The LLM itself is entirely server-side — the client only shows missions
and edits the bank.

---

## How the client is wired today (for context)

- `composables/useSession.js` owns the single Socket.IO connection and exposes
  refs (`jobs`, `tasks`, `commands`, `paused`, …) plus verbs (`resolve`,
  `reject`, `enqueue`, `run`, `upload`, …). New server events are handled by
  adding a `socket.on(...)` here and a ref/verb to the returned object.
- `stores/media.js` (Pinia) holds `currentMedia` and derives `mediaType`, which
  `App.vue` maps to a player component.
- `App.vue` renders the current player plus a column of fixed circular control
  buttons on the left edge, and panels (`UploadPanel`, `MediaList`,
  `QueuePanel`, `TerminalPanel`).

Both features follow the existing pattern: a new `socket.on` + verb in
`useSession`, an optional Pinia slice, a panel component, and a control button in
`App.vue`. No change to the player loop itself.

---

## 1. Streaming — control & status

Streaming runs entirely server-side; the client only **controls and monitors** it.

- **`useSession.js`:**
  - handle `broadcast:state` → a `broadcastState` ref
    `{ live, uptime, currentKey, target, segmentsAhead, lastError }` (stream key
    is masked server-side; the client never sees it).
  - verbs `startBroadcast({ url?, key? })` and `stopBroadcast()` →
    `socket.emit('run', { action: 'broadcast', params: { op } })` (reusing the
    existing `run` dispatch).
- **`components/BroadcastPanel.vue`** (new): a collapsible panel like
  `QueuePanel`. Shows a **● LIVE** indicator (uptime, current clip name), the
  masked target, `segmentsAhead`, and any `lastError`; a Start / Stop toggle.
  Optionally a field to enter the RTMP URL/key when not set via env (sent once,
  not stored client-side).
- **`App.vue`:** mount `BroadcastPanel`; add a broadcast control button to the
  left-edge button column (same style as `.explore-btn` etc., e.g. a
  `fa-broadcast-tower` / `fa-tower-cell` icon) that reflects live state.
- **HLS monitor (in scope — decided):** a small `<video>` monitor in the panel
  pointed at `/broadcast/live.m3u8`, so the operator sees exactly what's going out
  without opening YouTube. Uses native HLS where available (Safari/iOS) with
  `hls.js` as the fallback for other browsers. Collapsible; muted by default.

No new store is needed — `broadcastState` in `useSession` is enough.

---

## 2. Missions — presenting a prompt & capturing the answer

- **`stores/mission.js`** (new, small): `currentMission` and status helpers, kept
  separate from `media.js` so a mission never interferes with the playback store.
- **`useSession.js`:**
  - handle `mission:state` → `currentMission` (the current open mission, or
    null).
  - verb `answerMission(missionKey, { text } | file)`:
    - text → `run('respond', { missionKey, text })`.
    - image/video → reuse the existing `upload` flow, then `run('respond', {
      missionKey, key })` (or a single combined `respond` upload payload —
      engine doc §2.5).
- **`components/MissionPanel.vue`** (new): shows the current mission's `prompt`
  and its `accepts` set. Renders the matching answer affordance — a textarea for
  text, the file picker (reusing `UploadPanel`'s Android-friendly picker logic)
  for image/video. A **Dismiss** action (`run('mission', { op: 'dismiss', key })`)
  and a **Skip/Next mission** action.
  - **Surfacing (decided — both, toggleable):** a quiet, dismissible panel with a
    badge is always available; a per-user "nudge me" setting (persisted in
    `localStorage`, like the sound preference) additionally surfaces a mission as a
    brief, dismissible toast/overlay between items now and then. **Never** a modal
    over playing media — playback always continues underneath.
- **Theme display + schedule editor:** `useSession` handles `theme:state` → a
  `theme` ref; the current theme (label + **domain**, e.g. "🎃 Halloween" or
  "🕯 Philosophy · Free will", generated hourly server-side) shows in the
  `MissionPanel` header. A lightweight editor lets the operator view/edit the
  **domain palette** and the **hour→domain schedule** (`run('theme', { op:
  'getSchedule'|'setSchedule'|'setDomains' })`) — so which theme suits which hour is
  tunable at runtime. The theme is computed server-side (calendar + schedule +
  Ollama); the client displays and configures it.
- **`components/PromptBankPanel.vue`** (new): the runtime bank admin — list, add,
  edit, remove prompts and trigger `seed`, all via `run('prompt', { op, ... })`.
  This is the "runtime collection + UI" authoring decision; each prompt has `text`,
  `accepts[]`, `terms[]`, `enabled`. Collapsible, like `QueuePanel`. The LLM agent
  runs server-side (Ollama) and is not touched here — this panel curates the bank
  that steers it and stands in when it's offline.
- **`App.vue`:** mount `MissionPanel` (+ `PromptBankPanel`); add a mission button
  to the left-edge column (e.g. `fa-lightbulb` / `fa-flag`) that badges when an
  open mission exists.

---

## Files — `zap-cli`

New: `components/BroadcastPanel.vue`, `components/MissionPanel.vue`,
`components/PromptBankPanel.vue`, `stores/mission.js`.

Edited: `composables/useSession.js` (two `socket.on` handlers + verbs),
`App.vue` (mount panels + two control buttons), `scss/theme.scss` if any shared
styles are needed.

Tests: `test/mission.test.js` (answer-verb payload shaping, accepts-based
affordance selection). Streaming is thin on the client; its logic is
server-side and tested there.

---

## What deliberately does **not** change

- The playback loop (`play` → `resolve`/`reject`) and its players
  (`VideoPlayer`, `ImagePlayer`, `TextPlayer`, `AudioPlayer`) are untouched.
- `stores/media.js` is untouched; missions get their own store slice.
- Streaming adds **no** client-side media handling — it's a remote broadcast the
  browser only starts, stops, and watches the status of.
