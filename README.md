# Eswatini Travel AI Agent

AI travel agent for the PayPal AI Hackathon 2026. Travellers chat with an AI agent ("cheapest Johannesburg to Lahore in December, 1 stop max"); the agent searches fares with a tool call, recommends the cheapest match, and payment flows straight into PayPal Checkout (Orders v2 API, sandbox).

## Run it locally

1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env.local` and paste your PayPal **sandbox** Client ID and Secret (developer.paypal.com → Apps & Credentials → Sandbox → Default Application).
4. Optional, for the LLM agent: paste a free Groq API key into `LLM_API_KEY` (https://console.groq.com/keys, no credit card needed). Without it the agent still works using its rule-based parser.
5. `npm run dev` and open http://localhost:3000
6. Ask the agent for a fare (or tap an example), then pay for its pick with PayPal using your **sandbox Personal** test account.
7. `npm test` runs the agent unit tests (Node's built-in test runner).

`.env.local` is in `.gitignore`. Never commit real keys.

## AI agent

- **Endpoint:** `POST /api/agent` with `{ "messages": [{ "role": "user", "content": "cheapest Johannesburg to Lahore in December, 1 stop max" }] }` returns `{ reply, recommendedFareId, fare, toolCalls, mode }`.
- **LLM mode** (when `LLM_API_KEY` is set): calls any OpenAI-compatible chat completions API (`LLM_BASE_URL`, `LLM_MODEL`; defaults to Groq `llama-3.3-70b-versatile`) with function calling. The model calls the `search_fares(origin, destination, depart_date?, return_date?, max_stops?)` tool, which reads `lib/fares.js` and returns matches sorted by price, then recommends the cheapest.
- **Rule-based mode** (no key, or the LLM is unreachable): a deterministic parser reads the route, month/date and stop limit from the message and runs the same `search_fares` tool, so the demo always works.
- The chat UI shows each tool call the agent made and which mode answered, then a fare card for the pick with a PayPal button. The server re-reads the price from the fare id, so the agent (or the browser) can't change the amount.
- Keys are read only on the server and are never logged or sent to the browser.

| Variable | Required | Default |
| --- | --- | --- |
| `LLM_API_KEY` | No (falls back to rules) | — |
| `LLM_BASE_URL` | No | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | No | `llama-3.3-70b-versatile` |

## How payment works

- The browser sends only the fare id to `/api/orders`; the server looks up the price and creates the PayPal order, so the amount can't be changed in the browser.
- After approval, `/api/orders/[orderID]/capture` captures the payment and returns the capture ID.

## Roadmap

- [x] Sandbox checkout (create + capture order)
- [x] AI agent chat that searches fares and picks the cheapest (LLM tool calling + rule-based fallback)
- [ ] Agent-initiated payment, receipts, refunds
- [ ] Deploy (free tier) and demo video

## License

MIT
