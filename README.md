# Eswatini Travel AI Agent

AI travel agent for the PayPal AI Hackathon 2026. It finds the cheapest Johannesburg ↔ Lahore fare and takes payment through PayPal Checkout (Orders v2 API, sandbox).

## Run it locally

1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env.local` and paste your PayPal **sandbox** Client ID and Secret (developer.paypal.com → Apps & Credentials → Sandbox → Default Application).
4. `npm run dev` and open http://localhost:3000
5. Select a fare, click PayPal, and log in with your **sandbox Personal** test account.

`.env.local` is in `.gitignore`. Never commit real keys.

## How payment works

- The browser sends only the fare id to `/api/orders`; the server looks up the price and creates the PayPal order, so the amount can't be changed in the browser.
- After approval, `/api/orders/[orderID]/capture` captures the payment and returns the capture ID.

## Roadmap

- [x] Sandbox checkout (create + capture order)
- [ ] AI agent chat that searches fares and picks the cheapest
- [ ] Agent-initiated payment, receipts, refunds
- [ ] Deploy (free tier) and demo video

## License

MIT
