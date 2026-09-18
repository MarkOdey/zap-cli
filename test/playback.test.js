import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * The stall this guards against: `<component :is>` reuses an instance when the
 * component type does not change, so two images in a row never remount. Players
 * that reset only in onMounted keep `resolved` from the previous item, and
 * resolve() returns early — playback parks with the second image on screen.
 *
 * This models the lifecycle to prove a key is what prevents it.
 */
function makePlayer() {
  let resolved = false
  let advances = 0
  return {
    mount() { resolved = false },              // onMounted
    finish() { if (resolved) return; resolved = true; advances++ },
    get advances() { return advances },
  }
}

/**
 * Without a key, a same-type item reuses the instance and never remounts. Counted
 * across every instance, not just the last, or the tally is of the final component
 * rather than of the run.
 */
function playUnkeyed(items) {
  let player = null
  let lastType = null
  let total = 0

  for (const item of items) {
    if (item.type !== lastType) {
      total += player?.advances ?? 0
      player = makePlayer()
      player.mount()
    }
    lastType = item.type
    player.finish()
  }

  return total + (player?.advances ?? 0)
}

/** With a key, every item gets a fresh instance. */
function playKeyed(items) {
  let total = 0
  for (const item of items) {
    const player = makePlayer()
    player.mount()
    player.finish()
    total += player.advances
  }
  return total
}

const threeImages = [{ type: 'image' }, { type: 'image' }, { type: 'image' }]
const alternating = [{ type: 'image' }, { type: 'video' }, { type: 'image' }]

describe('playback: advancing between items', () => {
  it('reproduces the stall: same-type items advance only once without a key', () => {
    assert.equal(playUnkeyed(threeImages), 1, 'the second and third image never advance')
  })

  it('explains why it was intermittent: alternating types always worked', () => {
    assert.equal(playUnkeyed(alternating), 3, 'a type change forces a remount')
  })

  it('a key per item advances every time', () => {
    assert.equal(playKeyed(threeImages), 3)
    assert.equal(playKeyed(alternating), 3)
  })

  it('holds for a long run of one kind, which is most of the library', () => {
    const many = Array.from({ length: 20 }, () => ({ type: 'image' }))
    assert.equal(playUnkeyed(many), 1)
    assert.equal(playKeyed(many), 20)
  })
})

/** The watchdog's limits, mirrored from useSession. */
const STALL_LIMIT_MS = { image: 60_000, text: 60_000, audio: 20 * 60_000, video: 20 * 60_000 }

describe('playback: stall watchdog', () => {
  it('covers every kind a player handles', () => {
    for (const kind of ['image', 'text', 'audio', 'video']) {
      assert.ok(STALL_LIMIT_MS[kind] > 0, `${kind} needs a limit`)
    }
  })

  it('gives timed media far longer than stills', () => {
    assert.ok(STALL_LIMIT_MS.video > STALL_LIMIT_MS.image * 5,
      'a long video must not be cut off as though it had stalled')
  })

  it('still bounds timed media, so a stuck video cannot park forever', () => {
    assert.ok(STALL_LIMIT_MS.video <= 30 * 60_000)
  })

  it('gives a still long enough to load over a slow connection', () => {
    // The player's own load timeout is 30s; the watchdog must sit outside it.
    assert.ok(STALL_LIMIT_MS.image > 30_000)
  })
})
