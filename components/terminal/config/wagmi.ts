import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, mainnet, arbitrum, polygon, bsc, optimism, avalanche } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

// Get your projectId at https://cloud.reown.com
// For now, using a valid demo project ID
export const projectId = 'b2123ccbf471a2b0c3f09ba9624be206'

const metadata = {
  name: 'Veklom Sovereign Control Plane',
  description: 'Veklom Control Plane with x402 Payments',
  url: 'https://veklom.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Custom networks for Monad and Arq since they might not be built-in
const monad = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad',
  nativeCurrency: { name: 'Monad', symbol: 'MONAD', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
}

const arq = {
  id: 864,
  name: 'Arq',
  network: 'arq',
  nativeCurrency: { name: 'ARQ', symbol: 'ARQ', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.arq.network'] } },
}

// x402 requires base mainnet
export const networks = [base, mainnet, arbitrum, polygon, bsc, optimism, avalanche, monad, arq] as any;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Initialize AppKit
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: true, // Enable email login
    socials: ['google', 'x', 'discord', 'github', 'apple'], // Enable socials
    emailShowWallets: true, // Show standard wallets below email input
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ]
})
