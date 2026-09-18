import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * The sequential batch logic from useSession.uploadAll, isolated so it can be
 * tested without a socket. Kept in step with the implementation by shape: it
 * takes a sender, so the real one differs only in where `send` comes from.
 */
async function uploadAll(files, read, send, onProgress = () => {}) {
  const list = [...files]
  let progress = { done: 0, total: list.length, current: null, failures: [] }
  onProgress(progress)

  for (const file of list) {
    progress = { ...progress, current: file.name }
    onProgress(progress)
    try {
      const payload = await read(file)
      const result = await send({ name: file.name, type: file.type }, payload)
      if (!result.ok) progress.failures.push({ name: file.name, error: result.error })
    } catch (err) {
      progress.failures.push({ name: file.name, error: err?.message ?? 'could not read file' })
    }
    progress = { ...progress, done: progress.done + 1 }
    onProgress(progress)
  }

  return { ...progress, current: null }
}

const file = (name, type = 'text/plain') => ({ name, type })
const readOk = async (f) => `data:${f.type};base64,${Buffer.from(f.name).toString('base64')}`
const sendOk = async (meta) => ({ ok: true, name: meta.name, segments: 1 })

describe('uploadAll', () => {
  it('uploads every file', async () => {
    const sent = []
    const summary = await uploadAll(
      [file('a.txt'), file('b.txt'), file('c.txt')],
      readOk,
      async (meta, data) => { sent.push(meta.name); return sendOk(meta, data) },
    )
    assert.deepEqual(sent, ['a.txt', 'b.txt', 'c.txt'])
    assert.equal(summary.done, 3)
    assert.equal(summary.failures.length, 0)
  })

  // Each file crosses the socket as base64; several large ones at once would hold
  // hundreds of megabytes at both ends.
  it('sends them one at a time, never overlapping', async () => {
    let inFlight = 0
    let maxInFlight = 0
    await uploadAll(
      [file('a'), file('b'), file('c'), file('d')],
      readOk,
      async (meta) => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise(r => setTimeout(r, 5))
        inFlight--
        return sendOk(meta)
      },
    )
    assert.equal(maxInFlight, 1, `expected strictly sequential, saw ${maxInFlight} at once`)
  })

  it('keeps going after one file fails, and reports which', async () => {
    const summary = await uploadAll(
      [file('good1'), file('bad'), file('good2')],
      readOk,
      async (meta) => (meta.name === 'bad'
        ? { ok: false, name: meta.name, error: 'disk full' }
        : sendOk(meta)),
    )
    assert.equal(summary.done, 3, 'all three attempted')
    assert.equal(summary.failures.length, 1)
    assert.equal(summary.failures[0].name, 'bad')
    assert.equal(summary.failures[0].error, 'disk full')
  })

  it('treats an unreadable file as a failure, not a crash', async () => {
    const summary = await uploadAll(
      [file('ok'), file('unreadable')],
      async (f) => { if (f.name === 'unreadable') throw new Error('could not read unreadable'); return readOk(f) },
      sendOk,
    )
    assert.equal(summary.done, 2)
    assert.equal(summary.failures.length, 1)
    assert.match(summary.failures[0].error, /could not read/)
  })

  it('reports progress that only moves forward', async () => {
    const seen = []
    await uploadAll([file('a'), file('b'), file('c')], readOk, sendOk, (p) => seen.push(p.done))
    assert.deepEqual(seen, [...seen].sort((x, y) => x - y), 'done should never go backwards')
    assert.equal(seen[seen.length - 1], 3)
  })

  it('names the file currently in flight', async () => {
    const names = []
    await uploadAll([file('one'), file('two')], readOk, sendOk, (p) => { if (p.current) names.push(p.current) })
    assert.ok(names.includes('one') && names.includes('two'))
  })

  it('handles an empty selection', async () => {
    const summary = await uploadAll([], readOk, sendOk)
    assert.equal(summary.total, 0)
    assert.equal(summary.done, 0)
    assert.equal(summary.failures.length, 0)
  })

  it('handles a single file the same way as many', async () => {
    const summary = await uploadAll([file('solo')], readOk, sendOk)
    assert.equal(summary.total, 1)
    assert.equal(summary.done, 1)
    assert.equal(summary.current, null)
  })
})
