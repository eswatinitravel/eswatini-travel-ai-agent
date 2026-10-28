// AI travel agent: LLM with tool calling (any OpenAI-compatible endpoint, Groq by default)
// plus a deterministic rule-based fallback so the demo works with no API key.
// Server-only. Never log keys.
import { searchFares, findFare } from "./fares.js";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_fares",
      description:
        "Search available flight fares. Returns matching fares sorted by price (cheapest first). Airport codes: JNB = Johannesburg (also serves Eswatini travellers), LHE = Lahore.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "IATA origin airport code, e.g. JNB" },
          destination: { type: "string", description: "IATA destination airport code, e.g. LHE" },
          depart_date: { type: "string", description: "Departure day YYYY-MM-DD or month YYYY-MM (optional)" },
          return_date: { type: "string", description: "Return day YYYY-MM-DD (optional)" },
          max_stops: { type: "integer", description: "Maximum number of stops/connections (optional)" }
        },
        required: ["origin", "destination"]
      }
    }
  }
];

function systemPrompt(now = new Date()) {
  return [
    "You are the Eswatini Travel AI Agent. You help travellers find the cheapest flight between Johannesburg (JNB) and Lahore (LHE).",
    `Today is ${now.toISOString().slice(0, 10)}. If the user names a month without a year, use its next occurrence (format YYYY-MM).`,
    "Always call search_fares before recommending anything. Never invent fares or prices.",
    "Recommend the cheapest fare that meets the user's constraints. Mention airline, route via, date, stops and USD price, and include its fare id in brackets like [QR-JNB-LHE-1].",
    "Tell the user they can pay for it with the PayPal button below. Keep replies short (2-4 sentences).",
    "If nothing matches, say so and suggest relaxing a constraint (date or stops)."
  ].join(" ");
}

// ---------- Rule-based fallback ----------

const PLACES = [
  { code: "JNB", words: ["johannesburg", "joburg", "jo'burg", "jozi", "jnb", "south africa", "eswatini", "swaziland", "mbabane", "manzini"] },
  { code: "LHE", words: ["lahore", "lhe", "pakistan", "gujrat", "sialkot"] }
];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const NUMBER_WORDS = { zero: 0, no: 0, one: 1, two: 2, three: 3 };

function findPlaces(text) {
  const hits = [];
  for (const p of PLACES) {
    for (const w of p.words) {
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\']/g, "\\$&")}\\b`, "i");
      const m = re.exec(text);
      if (m) { hits.push({ code: p.code, index: m.index }); break; }
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

function resolveMonth(monthIndex, now) {
  const year = monthIndex >= now.getUTCMonth() ? now.getUTCFullYear() : now.getUTCFullYear() + 1;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Turn a free-text request into search_fares arguments. Exported for tests. */
export function parseRequest(text, now = new Date()) {
  const t = (text || "").toLowerCase();
  const args = {};

  // Route: a place right after "from" is the origin, after "to" the destination;
  // otherwise use the order of mention.
  const places = findPlaces(t).map((p) => {
    const before = t.slice(Math.max(0, p.index - 12), p.index);
    const role = /\bfrom\s+(\S+\s+)?$/.test(before) ? "origin" : /\b(to|into|towards?)\s+(\S+\s+)?$/.test(before) ? "destination" : null;
    return { ...p, role };
  });
  for (const p of places) if (p.role && !args[p.role]) args[p.role] = p.code;
  for (const p of places) {
    if (Object.values(args).includes(p.code)) continue;
    if (!args.origin) args.origin = p.code; else if (!args.destination) args.destination = p.code;
  }
  // One place named: the other end of the JNB <-> LHE route fills the gap.
  if (args.origin && !args.destination) args.destination = args.origin === "JNB" ? "LHE" : "JNB";
  if (args.destination && !args.origin) args.origin = args.destination === "JNB" ? "LHE" : "JNB";

  // Date: explicit YYYY-MM-DD, else month name.
  const iso = /\b(20\d\d-\d\d(?:-\d\d)?)\b/.exec(t);
  if (iso) args.depart_date = iso[1];
  else {
    const mi = MONTHS.findIndex((m) => new RegExp(`\\b${m}\\b|\\b${m.slice(0, 3)}\\b`).test(t));
    if (mi >= 0) args.depart_date = resolveMonth(mi, now);
  }

  // Stops.
  if (/\b(non[- ]?stop|direct)\b/.test(t)) args.max_stops = 0;
  else {
    const m = /(?:max(?:imum)?|at most|up to|no more than)?\s*(\d|zero|one|two|three)\s*stops?(?:\s*max)?/.exec(t);
    if (m) args.max_stops = /^\d$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1]];
  }
  return args;
}

function describeFare(f) {
  return `${f.airline} ${f.from} → ${f.to} via ${f.via} (${f.stops} stop${f.stops === 1 ? "" : "s"}) on ${f.depart} for $${f.price}`;
}

export function ruleBasedAgent(messages, now = new Date()) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const args = parseRequest(lastUser, now);
  const trace = [];
  if (!args.origin || !args.destination) {
    return {
      reply: "Tell me where you're flying, for example \"cheapest Johannesburg to Lahore in December, 1 stop max\". I currently search JNB ↔ LHE.",
      recommendedFareId: null,
      toolCalls: trace
    };
  }
  let result = searchFares(args);
  trace.push({ name: "search_fares", arguments: args, resultCount: result.count });
  let relaxed = "";
  if (result.count === 0 && args.depart_date) {
    const looser = { ...args }; delete looser.depart_date;
    result = searchFares(looser);
    trace.push({ name: "search_fares", arguments: looser, resultCount: result.count });
    if (result.count) relaxed = ` Nothing matched ${args.depart_date}, so I widened the dates.`;
  }
  if (result.count === 0) {
    return { reply: "I couldn't find a fare that matches. Try allowing more stops or another month.", recommendedFareId: null, toolCalls: trace };
  }
  const best = result.results[0];
  const others = result.count > 1 ? ` I compared ${result.count} fares; the next cheapest is $${result.results[1].price}.` : "";
  return {
    reply: `Cheapest match: ${describeFare(best)} [${best.id}].${others}${relaxed} You can pay for it with PayPal below.`,
    recommendedFareId: best.id,
    toolCalls: trace
  };
}

// ---------- LLM agent with tool calling ----------

function pickFareId(text, lastResults) {
  const ids = (text || "").match(/[A-Z]{2}-[A-Z]{3}-[A-Z]{3}-\d+/g) || [];
  const allowed = new Set(lastResults.map((f) => f.id));
  const mentioned = ids.find((id) => allowed.has(id) || (!lastResults.length && findFare(id)));
  return mentioned || lastResults[0]?.id || null;
}

export async function llmAgent(messages, { baseUrl, apiKey, model, now = new Date(), fetchImpl = fetch } = {}) {
  const convo = [{ role: "system", content: systemPrompt(now) }, ...messages];
  const trace = [];
  let lastResults = [];

  for (let step = 0; step < 4; step++) {
    const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: convo, tools: TOOLS, tool_choice: "auto", temperature: 0.2 }),
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`LLM request failed (${res.status}): ${data?.error?.message || "unknown error"}`);
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error("LLM returned no message");

    if (msg.tool_calls?.length) {
      convo.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
      for (const call of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(call.function?.arguments || "{}"); } catch { args = {}; }
        const result = call.function?.name === "search_fares" ? searchFares(args) : { error: "unknown tool" };
        if (result.results) lastResults = result.results;
        trace.push({ name: call.function?.name, arguments: args, resultCount: result.count ?? 0 });
        convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
      continue;
    }

    const reply = (msg.content || "").trim();
    return { reply, recommendedFareId: trace.length ? pickFareId(reply, lastResults) : null, toolCalls: trace };
  }
  // Ran out of steps: answer from the last tool result.
  const best = lastResults[0];
  return {
    reply: best ? `Cheapest match: ${describeFare(best)} [${best.id}].` : "I couldn't complete the search. Please rephrase.",
    recommendedFareId: best?.id || null,
    toolCalls: trace
  };
}

/** Sanitize incoming chat history: only user/assistant text, bounded size. */
export function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

export async function runAgent(rawMessages, env = process.env) {
  const messages = cleanMessages(rawMessages);
  if (!messages.some((m) => m.role === "user")) {
    return { reply: "Ask me for a fare, e.g. \"cheapest Johannesburg to Lahore in December\".", recommendedFareId: null, toolCalls: [], mode: "rules" };
  }
  const apiKey = env.LLM_API_KEY;
  const model = env.LLM_MODEL || DEFAULT_MODEL;
  if (apiKey) {
    try {
      const out = await llmAgent(messages, { baseUrl: env.LLM_BASE_URL || DEFAULT_BASE_URL, apiKey, model });
      return { ...out, mode: "llm", model };
    } catch (err) {
      // Fall through to rules so the demo never breaks; message has no secrets.
      const out = ruleBasedAgent(messages);
      return { ...out, mode: "rules", notice: `LLM unavailable (${err.message}); used the built-in rule-based agent.` };
    }
  }
  return { ...ruleBasedAgent(messages), mode: "rules" };
}
