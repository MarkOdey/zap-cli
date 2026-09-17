import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { tokenize, coerce, parseCommand, suggest, applySuggestion, usage } from '../src/scripts/command.js'

const COMMANDS = [
  { name: 'isolate', params: ['key', 'label', 'all'], queueable: true },
  { name: 'compose', params: ['from', 'to', 'label', 'scale'], queueable: true },
  { name: 'find', params: ['key'], queueable: false },
  { name: 'explore', params: [], queueable: true },
  { name: 'list', params: ['skip', 'limit', 'sort'], queueable: false },
]

describe('tokenize', () => {
  it('splits on whitespace', () => {
    assert.deepEqual(tokenize('a b  c'), ['a', 'b', 'c'])
  })

  it('keeps double-quoted text together', () => {
    assert.deepEqual(tokenize('isolate "data/my photo.jpg"'), ['isolate', 'data/my photo.jpg'])
  })

  it('keeps single-quoted text together', () => {
    assert.deepEqual(tokenize("find 'a b'"), ['find', 'a b'])
  })

  it('preserves an empty quoted string as a token', () => {
    assert.deepEqual(tokenize('find ""'), ['find', ''])
  })

  it('returns nothing for blank input', () => {
    assert.deepEqual(tokenize(''), [])
    assert.deepEqual(tokenize('   '), [])
  })
})

describe('coerce', () => {
  it('converts booleans, numbers and null', () => {
    assert.equal(coerce('true'), true)
    assert.equal(coerce('false'), false)
    assert.equal(coerce('null'), null)
    assert.equal(coerce('42'), 42)
    assert.equal(coerce('0.5'), 0.5)
    assert.equal(coerce('-3'), -3)
  })

  it('leaves real strings alone', () => {
    assert.equal(coerce('person'), 'person')
    assert.equal(coerce('data/a.jpg'), 'data/a.jpg')
    assert.equal(coerce(''), '')
  })

  // A key like "2024" must not silently become a number the server cannot match.
  it('is applied to values, so numeric-looking keys become numbers', () => {
    assert.equal(coerce('2024'), 2024)
  })
})

describe('parseCommand', () => {
  it('rejects an empty line', () => {
    assert.ok(parseCommand('', COMMANDS).error)
  })

  it('rejects an unknown action', () => {
    assert.match(parseCommand('bogus', COMMANDS).error, /unknown command/)
  })

  it('parses an action with no arguments', () => {
    assert.deepEqual(parseCommand('explore', COMMANDS), { action: 'explore', params: {} })
  })

  it('maps positional values onto declared params in order', () => {
    assert.deepEqual(parseCommand('isolate data/a.jpg person', COMMANDS), {
      action: 'isolate',
      params: { key: 'data/a.jpg', label: 'person' },
    })
  })

  it('parses --name=value', () => {
    assert.deepEqual(parseCommand('isolate --key=data/a.jpg --label=person', COMMANDS), {
      action: 'isolate',
      params: { key: 'data/a.jpg', label: 'person' },
    })
  })

  it('parses --name value', () => {
    assert.deepEqual(parseCommand('isolate --key data/a.jpg --label person', COMMANDS), {
      action: 'isolate',
      params: { key: 'data/a.jpg', label: 'person' },
    })
  })

  it('treats a bare --flag as true', () => {
    assert.deepEqual(parseCommand('isolate data/a.jpg --all', COMMANDS), {
      action: 'isolate',
      params: { key: 'data/a.jpg', all: true },
    })
  })

  it('mixes positional and named forms', () => {
    assert.deepEqual(parseCommand('compose data/a.jpg --to=data/b.jpg --scale=0.7', COMMANDS), {
      action: 'compose',
      params: { from: 'data/a.jpg', to: 'data/b.jpg', scale: 0.7 },
    })
  })

  it('lets a named value win over the positional slot', () => {
    const { params } = parseCommand('isolate --key=named.jpg positional.jpg', COMMANDS)
    assert.equal(params.key, 'named.jpg')
  })

  it('handles quoted values containing spaces', () => {
    assert.deepEqual(parseCommand('isolate "data/my photo.jpg"', COMMANDS).params,
      { key: 'data/my photo.jpg' })
    assert.deepEqual(parseCommand('isolate --label="a person"', COMMANDS).params,
      { label: 'a person' })
  })

  it('coerces numeric and boolean values', () => {
    const { params } = parseCommand('list --skip=20 --limit=50', COMMANDS)
    assert.equal(params.skip, 20)
    assert.equal(params.limit, 50)
  })

  it('rejects more positional arguments than the action declares', () => {
    assert.match(parseCommand('find a b c', COMMANDS).error, /at most 1 positional argument/)
  })

  it('ignores surrounding whitespace', () => {
    assert.deepEqual(parseCommand('   explore   ', COMMANDS), { action: 'explore', params: {} })
  })
})

describe('suggest', () => {
  it('completes action names on the first token', () => {
    const { items, kind } = suggest('is', COMMANDS)
    assert.equal(kind, 'action')
    assert.deepEqual(items, ['isolate'])
  })

  it('lists every action for an empty line', () => {
    assert.equal(suggest('', COMMANDS).items.length, COMMANDS.length)
  })

  it('narrows on a shared prefix', () => {
    assert.deepEqual(suggest('co', COMMANDS).items, ['compose'])
  })

  it('returns nothing for a prefix that matches no action', () => {
    assert.deepEqual(suggest('zzz', COMMANDS).items, [])
  })

  it('switches to parameter names after the action', () => {
    const { items, kind } = suggest('isolate ', COMMANDS)
    assert.equal(kind, 'param')
    assert.deepEqual(items, ['--key', '--label', '--all'])
  })

  it('filters parameters by what is typed', () => {
    assert.deepEqual(suggest('isolate --l', COMMANDS).items, ['--label'])
  })

  it('omits parameters already supplied', () => {
    const { items } = suggest('isolate --key=a.jpg ', COMMANDS)
    assert.ok(!items.includes('--key'))
    assert.ok(items.includes('--label'))
  })

  it('does not try to complete values', () => {
    assert.deepEqual(suggest('isolate data/a', COMMANDS).items, [])
  })

  it('returns nothing for an unknown action', () => {
    assert.deepEqual(suggest('bogus ', COMMANDS).items, [])
  })
})

describe('applySuggestion', () => {
  it('replaces a partial action name', () => {
    assert.equal(applySuggestion('is', 'is', 'isolate'), 'isolate ')
  })

  it('appends when nothing is being replaced', () => {
    assert.equal(applySuggestion('isolate ', '', '--key'), 'isolate --key ')
  })

  it('replaces a partial parameter without eating the action', () => {
    assert.equal(applySuggestion('isolate --l', '--l', '--label'), 'isolate --label ')
  })

  it('keeps earlier arguments intact', () => {
    assert.equal(applySuggestion('isolate a.jpg --l', '--l', '--label'), 'isolate a.jpg --label ')
  })
})

describe('usage', () => {
  it('shows params and marks queued actions', () => {
    assert.equal(usage(COMMANDS[0]), 'isolate [key] [label] [all]  (queued)')
    assert.equal(usage(COMMANDS[2]), 'find [key]')
    assert.equal(usage(COMMANDS[3]), 'explore  (queued)')
  })

  it('is safe with nothing to describe', () => {
    assert.equal(usage(undefined), '')
  })
})
