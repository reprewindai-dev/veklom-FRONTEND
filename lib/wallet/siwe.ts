// EIP-4361 (Sign-In with Ethereum) message for binding a wallet to a workspace.
// Built with viem's createSiweMessage; LockerPhycer verifies it (domain, chain,
// single-use nonce, freshness, EOA / ERC-1271 / ERC-6492 signature).
// Pattern: https://docs.cdp.coinbase.com/coinbase-wallet/guides/authenticate-users

import { createSiweMessage } from "viem/siwe";

export const SIWE_STATEMENT =
  "Bind this wallet to your Veklom workspace. It carries funding and execution authority for governed actions.";

export function buildWalletBindingMessage(params: {
  address: `0x${string}`;
  chainId: number;
  nonce: string;
  domain: string;
  uri: string;
  issuedAt?: Date;
}): string {
  const issuedAt = params.issuedAt ?? new Date();
  return createSiweMessage({
    address: params.address,
    chainId: params.chainId,
    domain: params.domain,
    nonce: params.nonce,
    uri: params.uri,
    version: "1",
    statement: SIWE_STATEMENT,
    issuedAt,
    expirationTime: new Date(issuedAt.getTime() + 10 * 60 * 1000),
  });
}
