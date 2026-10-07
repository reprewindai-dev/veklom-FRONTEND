import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    corridor: "x402_machine_commerce",
    status: "ready",
    simulated: true,
    description: "Veklom machine wallet and settlement corridor. Machines can provision a simulated sandbox testbed wallet (non-real balance) or connect a real external address.",
    options: {
      testbed_provisioning: {
        available: true,
        simulated: true,
        network: "base-sepolia",
        simulated_balance_usdc: 100.0,
        description: "Simulated sandbox wallet (base-sepolia) seeded with a non-real test balance. Not real funds, and it confers no authority; CAPPO authorizes every action independently.",
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        status: "active"
      },
      external_wallet: {
        supported_chains: [
          { chain: "base", chainId: 8453, token: "USDC" },
          { chain: "ethereum", chainId: 1, token: "USDC" },
          { chain: "solana", token: "USDC" }
        ],
        connect_url: "https://veklom.com/os"
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
