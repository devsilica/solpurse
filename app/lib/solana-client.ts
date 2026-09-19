import { createClient, MicroLamports } from "@solana/kit";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { solanaRpc, rpcAirdrop } from "@solana/kit-plugin-rpc";
import {
  associatedTokenProgram,
  tokenProgram,
} from "@solana-program/token";
import { memoProgram } from "@solana-program/memo";
import { systemProgram } from "@solana-program/system";

export type ClusterMoniker =
  | "devnet"
  | "testnet"
  | "mainnet"
  | "localnet";

export const CLUSTERS: ClusterMoniker[] = [
  "devnet",
  "testnet",
  "mainnet",
  "localnet",
];

const CLUSTER_URLS: Record<ClusterMoniker, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
  localnet: "http://localhost:8899",
};

const WS_URLS: Record<ClusterMoniker, string> = {
  devnet: "wss://api.devnet.solana.com",
  testnet: "wss://api.testnet.solana.com",
  mainnet: "wss://api.mainnet-beta.solana.com",
  localnet: "ws://localhost:8900",
};

const WALLET_CHAINS: Record<ClusterMoniker, `solana:${string}`> = {
  devnet: "solana:devnet",
  testnet: "solana:testnet",
  mainnet: "solana:mainnet",

  // Wallets do not advertise a localnet chain.
  // Keep wallets discoverable while the RPC targets localnet.
  localnet: "solana:devnet",
};

export function getClusterUrl(cluster: ClusterMoniker) {
  return CLUSTER_URLS[cluster];
}

export function getWalletChain(cluster: ClusterMoniker) {
  return WALLET_CHAINS[cluster];
}

export type RpcUrlOverrides = {
  rpcUrl: string;
  rpcSubscriptionsUrl: string;
};

/**
 * Builds the app-wide Solana Kit client.
 */
export function createAppClient(
  cluster: ClusterMoniker,
  urls?: RpcUrlOverrides
) {
  return createClient()
    .use(
      walletSigner({
        chain: WALLET_CHAINS[cluster],
      })
    )
    .use(
      solanaRpc({
        rpcUrl: urls?.rpcUrl ?? CLUSTER_URLS[cluster],
        rpcSubscriptionsUrl:
          urls?.rpcSubscriptionsUrl ?? WS_URLS[cluster],
        transactionConfig: {
          microLamportsPerComputeUnit: 1000n as MicroLamports,
        },
      })
    )
    .use(rpcAirdrop())
    .use(systemProgram())
    .use(tokenProgram())
    .use(associatedTokenProgram())
    .use(memoProgram());
}

export type AppClient = ReturnType<typeof createAppClient>;