# Implementation plan (client): streaming & agent-built prompts

Status: **approved-decisions, implementation not started — plan only, awaiting
go-ahead.** The authoritative, cross-repo plan is
**`zap-api/docs/plan/streaming-and-prompts.md`**; this covers only the `zap-cli`
tasks (its Phase 2 and Phase 5). Design: `docs/design/streaming-and-prompts.md`.

Decisions in force: HLS preview is built; missions surface as a quiet panel plus
an opt-in "nudge" toast; broadcast audio is real (engine excludes silent clips);
missions are authored by a **local LLM agent (Ollama, server-side)** with a
**runtime-editable prompt bank** the client manages.

Branch: `claude/streaming-agent-prompts-edy4hq`. Tests: `node --test
"test/**/*.test.js"`.

---

## Phase 2 — Broadcast control & HLS monitor (engine Phase 1 must land first)

- [ ] **`composables/useSession.js`**
  - `socket.on('broadcast:state', …)` → a shared `broadcastState` ref
    `{ live, uptime, currentKey, target, segmentsAhead, lastError }` (key already
    masked server-side).
  - verbs `startBroadcast({ url?, key? })` / `stopBroadcast()` via the existing
    `run` dispatch (`action: 'broadcast'`, `params: { op }`). Add both to the
    returned object.
- [ ] **`components/BroadcastPanel.vue`** (new) — collapsible panel modelled on
  `QueuePanel.vue`:
  - **● LIVE** indicator with uptime + current clip name; masked target;
    `segmentsAhead`; `lastError`.
  - Start / Stop toggle; optional RTMP URL/key field when env hasn't set one (sent
    once via `startBroadcast`, never stored client-side).
  - **HLS monitor** `<video>` pointed at `/broadcast/live.m3u8` (resolved against
    the API origin like other media). Native HLS where supported; lazy-load
    `hls.js` as a fallback. Muted, collapsible.
- [ ] **`App.vue`** — mount `BroadcastPanel`; add a left-column control button
  (style like `.explore-btn`, e.g. `fa-tower-broadcast`) that reflects live state.
- [ ] **`package.json`** — add `hls.js` (dynamic import so it's only pulled when a
  non-native-HLS browser opens the monitor).

**Acceptance:** operator starts/stops the broadcast and watches the live HLS feed
in-browser; stream key never reaches the client; panel reflects `broadcast:state`.

---

## Phase 5 — Mission panel (engine Phases 3–4 must land first)

- [ ] **`stores/mission.js`** (new, small) — `currentMission` + status helpers,
  separate from `stores/media.js` so a mission never touches playback state.
- [ ] **`composables/useSession.js`**
  - `socket.on('mission:state', …)` → `currentMission`.
  - verb `answerMission(missionKey, { text } | file)`: text → `run('respond',
    { missionKey, text })`; image/video → reuse the existing `upload` flow, then
    `run('respond', { missionKey, key })`.
- [ ] **`components/MissionPanel.vue`** (new)
  - Shows the mission `prompt` and renders the answer affordance from `accepts`: a
    textarea for text; the file picker (reuse `UploadPanel`'s Android-friendly
    picker) for image/video.
  - **Dismiss** (`run('mission', { op:'dismiss', key })`) and **next mission**.
  - **Nudge toggle:** a per-user setting persisted in `localStorage` (mirror the
    `zap:sound` pattern in `useSession`) that, when on, briefly surfaces a mission
    as a dismissible toast/overlay between items. Never a modal over playing media.
- [ ] **`components/PromptBankPanel.vue`** (new) — runtime bank admin: list / add /
  edit / remove prompts and trigger `seed`, via `run('prompt', { op, ... })`. Each
  row edits `text`, `accepts[]`, `terms[]`, `enabled`. Collapsible like
  `QueuePanel`. (Curates the bank that steers the server-side Ollama agent and
  stands in when it's offline; the LLM itself is not configured here.)
- [ ] **Theme display** — `useSession` handles `theme:state` → a `theme` ref; show
  the current theme label (e.g. "🎃 Halloween") in the `MissionPanel` header, so
  the server's hourly seasonal steering is visible to the user.
- [ ] **`App.vue`** — mount `MissionPanel` (+ `PromptBankPanel`); add a left-column
  button (e.g. `fa-lightbulb`) that badges when an open mission exists.

**Tests:** `test/mission.test.js` — `answerMission` payload shaping (text vs
file→key), accepts-based affordance selection, nudge preference read/write;
prompt-bank op payloads.

**Acceptance:** an open mission appears in the panel; answering submits and clears
it; the nudge toggle controls occasional surfacing and playback continues
underneath throughout; the prompt bank can be edited from the client without a
redeploy.

---

## Unchanged by both phases

The playback loop and its players (`VideoPlayer`, `ImagePlayer`, `TextPlayer`,
`AudioPlayer`), `stores/media.js`, and the `play → resolve/reject` cycle are not
touched. Streaming adds no client-side media handling; missions get their own
store slice.
