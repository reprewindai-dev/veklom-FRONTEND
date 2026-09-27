import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    corridor: "x402_machine_commerce",
    status: "ready",
    description: "Veklom autonomous machine wallet and settlement corridor. Machines requiring USDC payment can provision an instant testbed wallet or connect an external address.",
    options: {
      testbed_provisioning: {
        available: true,
        network: "base-sepolia",
        prefunded_balance_usdc: 100.0,
        description: "Instant ephemeral sandbox wallet pre-credited with test USDC. No private key management or real funds required.",
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        status: "active"
      },
      external_wallet: {
        supported_chains: [
          { chain: "base", chainId: 8453, token: "USDC" },
          { chain: "ethereum", chainId: 1, token: "USDC" },
          { chain: "solana", token: "USDC" }
        ],
        connect_url: "https://veklom.com/settings/wallet"
      }
    },
    current_capability_pricing: {
      "veklom.governed-counter@v1": {
        action: "counter.increment",
        price_usdc: "0.00",
        payment_required: false,
        tier: "sandbox_free"
      }
    }
  });
}
