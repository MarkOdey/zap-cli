# zap-cli

Vue 3 browser client for the Zap multimedia player. Connects to `zap-api` via Socket.IO and renders media fullscreen as directed by the server.

## Features

1. **Multimedia playback** — displays video, image, and text items sequentially in fullscreen. Each player emits a completion event when done, which drives the next item.
2. **Upload** — submit video, image, or text content to the media library via the upload panel.
3. **Appreciation** — like or dislike the current item (adjusts its relevance weight on the API), or skip to the next one immediately.

---

## Playback Loop

The WebSocket connection between client and API drives a continuous playback cycle:

```
API emits 'play' (media document)
  → client renders VideoPlayer / ImagePlayer / TextPlayer
  → user likes it, or playback ends naturally  → emit 'resolve' → weight +0.1
  → user dislikes or skips                     → emit 'reject'  → weight −0.1
  → API selects next most relevant item        → emit 'play' again
```

Every media player component must emit `resolve` or `reject` when it finishes. This is what keeps the loop running.

---

## Architecture

```
src/
  main.js                       Vue app entry — registers Pinia, mounts App
  App.vue                       Root: renders current media component dynamically
  stores/
    media.js                    Pinia store — currentMedia, playbackState, mediaType
  composables/
    useSession.js               Socket.IO lifecycle — connect, resolve, reject, upload, run
  components/
    VideoPlayer.vue             HTML5 <video>; emits resolve near end or on like
    ImagePlayer.vue             <img>; auto-resolves after 2s; click or like to skip
    TextPlayer.vue              Text display; auto-resolves after display duration
    AppreciationControls.vue    Like / Dislike / Skip buttons overlay
    UploadPanel.vue             File and text upload UI
    Terminal.vue                Command input; Enter → socket run event
  scss/
    theme.scss                  Global styles
```

### State Flow

```
useSession composable
  socket 'play' event
    → mediaStore.setMedia(doc)           ← Pinia reactive state
      → App.vue computed currentComponent
        → renders <VideoPlayer> | <ImagePlayer> | <TextPlayer>
          → @resolve / @reject
            → useSession.resolve() / .reject()
              → socket.emit('resolve' | 'reject')
```

---

## Tech Stack

- Vue 3.2 with Composition API (`<script setup>`)
- Vite 4
- Pinia (state management)
- Socket.IO-client 4.6
- SCSS via sass
- Font Awesome 5

---

## Prerequisites

- Node.js ≥ 18 and npm
- `zap-api` running on `http://localhost:3000`

---

## Installation

```bash
cd zap-cli
npm install
```

---

## Running

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

---

## Configuration

The API URL is set in `src/composables/useSession.js` in the `connect()` call. Default: `http://localhost:3000/`.

---

## Appreciation Controls

Three overlay buttons are always visible:

| Button | Socket event | Weight effect |
|---|---|---|
| Like | `resolve` | +0.1 |
| Dislike | `reject` | −0.1 |
| Skip | `reject` | −0.1 |

Like and Skip both advance to the next item. Like increases the item's weight; Dislike and Skip decrease it.

---

## Upload

The upload panel accepts:
- **Video / Image**: file picker (`video/*`, `image/*`) — read as base64, sent via `socket.emit('upload', {meta, data})`
- **Text**: textarea — content sent as `text/plain`

---

## Terminal

The terminal input at the bottom of the screen accepts action names. Press Enter to dispatch to the server:

```
explore
play
removeAll
```

Commands are sent as `{action: "..."}` JSON over the `run` socket event.
