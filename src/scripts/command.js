/**
 * Parsing and completion for the terminal, driven by the action registry the
 * server sends on connect (`commands` event: [{name, params, queueable}]).
 */

/** Split a line into tokens, honouring single and double quotes. */
export function tokenize(line) {
  const tokens = []
  let current = ''
  let quote = null
  let hasContent = false

  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      hasContent = true
      continue
    }
    if (/\s/.test(char)) {
      if (hasContent || current) tokens.push(current)
      current = ''
      hasContent = false
      continue
    }
    current += char
  }

  if (hasContent || current) tokens.push(current)
  return tokens
}

/** "true"/"false" and numeric strings become their real types. */
export function coerce(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value)
  return value
}

/**
 * Turn a typed line into what the server's `run` handler expects.
 *
 * Accepts `cmd value`, `cmd --name=value` and `cmd --name value`. Positional
 * values fill the action's declared params in order, so `isolate data/a.jpg person`
 * is the same as `isolate --key=data/a.jpg --label=person`.
 *
 * @returns {{action: string, params: object}|{error: string}}
 */
export function parseCommand(line, commands = []) {
  const tokens = tokenize(line)
  if (tokens.length === 0) return { error: 'empty command' }

  const [action, ...rest] = tokens
  const spec = commands.find(c => c.name === action)
  if (!spec) return { error: `unknown command: ${action}` }

  const params = {}
  const positional = []

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]

    if (token.startsWith('--')) {
      const body = token.slice(2)
      const eq = body.indexOf('=')

      if (eq !== -1) {
        params[body.slice(0, eq)] = coerce(body.slice(eq + 1))
        continue
      }

      // `--flag value`, or a bare `--flag` meaning true
      const next = rest[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        params[body] = coerce(next)
        i++
      } else {
        params[body] = true
      }
      continue
    }

    positional.push(token)
  }

  const declared = spec.params ?? []
  positional.forEach((value, index) => {
    const name = declared[index]
    if (name && !(name in params)) params[name] = coerce(value)
  })

  const extra = positional.length - declared.length
  if (extra > 0) {
    return { error: `${action} takes at most ${declared.length} positional argument${declared.length === 1 ? '' : 's'}` }
  }

  return { action, params }
}

/**
 * Completions for the current line.
 *
 * On the first token it completes action names; afterwards it completes the
 * current action's parameter names. `replace` is the text being completed, so
 * the caller knows how much of the line to swap out.
 *
 * @returns {{items: string[], replace: string, kind: 'action'|'param'}}
 */
export function suggest(line, commands = []) {
  const endsWithSpace = /\s$/.test(line)
  const tokens = tokenize(line)
  const none = { items: [], replace: '', kind: 'action' }

  if (tokens.length === 0 || (tokens.length === 1 && !endsWithSpace)) {
    const partial = tokens[0] ?? ''
    return {
      kind: 'action',
      replace: partial,
      items: commands
        .map(c => c.name)
        .filter(name => name.startsWith(partial))
        .sort(),
    }
  }

  const spec = commands.find(c => c.name === tokens[0])
  if (!spec) return none

  const used = new Set(
    tokens.slice(1).filter(t => t.startsWith('--')).map(t => t.slice(2).split('=')[0]),
  )

  const partial = endsWithSpace ? '' : (tokens[tokens.length - 1] ?? '')
  // Only complete parameter names — values are the user's own data.
  if (partial && !partial.startsWith('--')) return none

  const stem = partial.startsWith('--') ? partial.slice(2) : ''
  return {
    kind: 'param',
    replace: partial,
    items: (spec.params ?? [])
      .filter(p => !used.has(p) && p.startsWith(stem))
      .map(p => `--${p}`),
  }
}

/** Replace the token being completed with the chosen suggestion. */
export function applySuggestion(line, replace, choice) {
  const base = replace ? line.slice(0, line.length - replace.length) : line
  const needsSpace = base.length > 0 && !/\s$/.test(base)
  return `${base}${needsSpace ? ' ' : ''}${choice} `
}

/** One-line usage hint for an action. */
export function usage(spec) {
  if (!spec) return ''
  const args = (spec.params ?? []).map(p => `[${p}]`).join(' ')
  return `${spec.name}${args ? ' ' + args : ''}${spec.queueable ? '  (queued)' : ''}`
}
