# TuitionTrust

TuitionTrust is a modern web platform that enables transparent, blockchain-backed donations to educational institutions via the XRP Ledger (XRPL). Donors can contribute using XRP or RLUSD, view donation history, and schools can register using Decentralized Identifiers (DIDs).

https://www.loom.com/share/146a54b61f414079be74ec868c9abd55?sid=79c3a93c-e9ef-44af-bfc1-08bdc2110343

## Canva Presentation

https://www.canva.com/design/DAGpup6tbyI/Lm2CqFq0QFZyrtR_PAs51Q/view?utm_content=DAGpup6tbyI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hc517d2ac43#7

## XRPL Test Net Transactions

Donation Wallet - https://testnet.xrpl.org/accounts/rNPhw4JALciTdSrwZ3gKwrntnS5zAUatDy

Donation Transactions - https://testnet.xrpl.org/accounts/rNPhw4JALciTdSrwZ3gKwrntnS5zAUatDy/transactions

## Features

- **Donate via QR Code:** Instantly donate XRP or RLUSD using a scannable QR code (responsive for mobile and desktop).
- **Live Donation Tracking:** View the latest 10 donations directly from the XRPL, including sender, amount, currency, and transaction link.
- **School Registration:** Schools can register by submitting a DID and XRPL address. DID types supported: `did:web` and `did:key`.
- **Verified Schools Directory:** Browse a list of registered schools and their profiles.
- **Balances API:** Serverless API endpoints fetch XRP and RLUSD balances using XRPL HTTP RPC (no WebSocket dependency).
- **Modern UI:** Built with Next.js (App Router), TypeScript, and Tailwind CSS for a fast and beautiful experience.
- **Supabase Integration:** (Planned) For storing school data and off-ledger verification workflows.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **XRPL Integration:** [xrpl.js](https://github.com/XRPLF/xrpl.js), HTTP RPC endpoints
- **QR Codes:** [qrcode.react](https://github.com/zpao/qrcode.react)
- **Backend:** Supabase (for school verification and storage, planned)
- **Deployment:** Netlify/Windsurf (see `windsurf_deployment.yaml`)

## Project Structure

```
/tuitiontrust
├── src
│   ├── app
│   │   ├── api                # Serverless API routes (balances, donations, XRPL queries, etc.)
│   │   ├── donate             # Donation page (QR, preset buttons, transaction history)
│   │   ├── donations          # Donations history page
│   │   ├── schools            # School registration and directory
│   │   ├── layout.tsx         # App layout
│   │   ├── page.tsx           # Home page (hero, QR, intro)
│   │   └── globals.css        # Tailwind CSS
│   ├── components             # Navbar, Footer, QrCodeDisplay, etc.
│   └── lib                    # supabaseClient.ts
├── public                     # Static assets (SVGs, favicon, etc.)
├── package.json               # Dependencies and scripts
├── .env.local                 # Environment variables (see below)
├── windsurf_deployment.yaml   # Deployment config
└── ...
```

## Environment Variables

Create a `.env.local` file in the project root with the following keys:

```
NEXT_PUBLIC_DONATION_ADDRESS=...          # XRPL wallet address for donations
NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS=...      # RLUSD issuer address
NEXT_PUBLIC_RLUSD_CURRENCY_CODE=...       # RLUSD currency code (hex)
XRPL_HTTP_RPC_URL=https://s.altnet.rippletest.net:51234/  # XRPL HTTP RPC endpoint
SUPABASE_URL=...                          # (optional, planned)
SUPABASE_ANON_KEY=...                     # (optional, planned)
```

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deployment is configured via `windsurf_deployment.yaml` and Netlify. To deploy:

1. Commit your changes.
2. Deploy using the Windsurf CLI or Netlify dashboard.
3. The site will be live at: https://tuitiontrust.windsurf.build

## Contributing

Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

## License

MIT


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
