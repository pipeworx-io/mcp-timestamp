interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Unix timestamp MCP.
 *
 * Keyless, offline: convert between Unix timestamps and ISO dates, get the
 * current time, and humanize a time as relative ("2 hours ago", "in 3 days").
 * All UTC. Uses the platform Date — no API, no key. (Distinct from `datecalc`,
 * which does date arithmetic & calendar facts.)
 */


function relative(ms: number): string {
  const abs = Math.abs(ms), fut = ms < 0; // ms = now - then; positive => past
  const units: [number, string][] = [[31536000000, 'year'], [2592000000, 'month'], [604800000, 'week'], [86400000, 'day'], [3600000, 'hour'], [60000, 'minute'], [1000, 'second']];
  for (const [u, name] of units) {
    if (abs >= u) { const n = Math.floor(abs / u); return fut ? `in ${n} ${name}${n === 1 ? '' : 's'}` : `${n} ${name}${n === 1 ? '' : 's'} ago`; }
  }
  return 'just now';
}

const tools: McpToolExport['tools'] = [
  {
    name: 'from_timestamp',
    description: 'Convert a Unix timestamp to an ISO-8601 UTC date + human forms. Auto-detects seconds vs milliseconds by magnitude (override with `unit`). Keyless, offline.',
    inputSchema: { type: 'object', properties: { timestamp: { type: 'number', description: 'Unix timestamp.' }, unit: { type: 'string', description: '"s" or "ms" (default: auto-detect).' } }, required: ['timestamp'] },
  },
  {
    name: 'to_timestamp',
    description: 'Convert an ISO-8601 (or other parseable) date string to a Unix timestamp (seconds + milliseconds). Keyless, offline.',
    inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'A date/time string, e.g. "2026-07-01T12:00:00Z".' } }, required: ['date'] },
  },
  {
    name: 'now',
    description: 'The current UTC time as ISO-8601 and Unix timestamp (seconds + milliseconds).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'relative_time',
    description: 'Humanize a date/time relative to now (or a given `from`): "2 hours ago", "in 3 days". Keyless, offline.',
    inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'The target date/time (ISO-8601 or Unix timestamp).' }, from: { type: 'string', description: 'Optional reference time (default: now).' } }, required: ['date'] },
  },
];

function parseDate(v: string): number {
  if (/^\d{10}$/.test(v)) return +v * 1000;
  if (/^\d{13}$/.test(v)) return +v;
  return Date.parse(v);
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'from_timestamp': {
      let ts = num(args, 'timestamp');
      const unit = typeof args.unit === 'string' ? args.unit : (Math.abs(ts) >= 1e11 ? 'ms' : 's');
      const ms = unit === 'ms' ? ts : ts * 1000;
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return { error: 'Invalid timestamp.' };
      return { input: ts, detected_unit: unit, iso: d.toISOString(), utc: d.toUTCString(), unix_seconds: Math.floor(ms / 1000), relative: relative(Date.now() - ms) };
    }
    case 'to_timestamp': {
      const ms = parseDate(reqStr(args, 'date', '"2026-07-01T12:00:00Z"').trim());
      if (Number.isNaN(ms)) return { error: 'Could not parse the date. Use ISO-8601 (e.g. "2026-07-01T12:00:00Z").' };
      return { date: new Date(ms).toISOString(), unix_seconds: Math.floor(ms / 1000), unix_milliseconds: ms };
    }
    case 'now': {
      const ms = Date.now();
      return { iso: new Date(ms).toISOString(), unix_seconds: Math.floor(ms / 1000), unix_milliseconds: ms };
    }
    case 'relative_time': {
      const then = parseDate(reqStr(args, 'date', '"2026-07-01"').trim());
      const from = typeof args.from === 'string' ? parseDate(args.from) : Date.now();
      if (Number.isNaN(then) || Number.isNaN(from)) return { error: 'Could not parse a date.' };
      return { date: new Date(then).toISOString(), relative: relative(from - then) };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function num(args: Record<string, unknown>, key: string): number {
  const v = args[key]; const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) throw new Error(`Required numeric argument "${key}" is missing or invalid.`);
  return n;
}
function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
