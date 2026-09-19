"use client";

import { useEffect, useState } from "react";
import { address, type Address } from "@solana/kit";

import { useAppClient } from "../client-provider";

const USDC_MINT = address(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

const USDC_DECIMALS = 6;

type ParsedTokenAccount = {
  account: {
    data: {
      parsed: {
        info: {
          tokenAmount: {
            amount: string;
          };
        };
      };
    };
  };
};

export function useUsdcBalance(owner?: Address) {
  const client = useAppClient();

  const [balance, setBalance] = useState(0);
  const [rawBalance, setRawBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!owner) {
      setBalance(0);
      setRawBalance("0");
      setError(null);
      setIsLoading(false);
      return;
    }

    const ownerAddress: Address = owner;

    let cancelled = false;

    async function loadBalance() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.rpc
          .getTokenAccountsByOwner(
            ownerAddress,
            {
              mint: USDC_MINT,
            },
            {
              encoding: "jsonParsed",
              commitment: "confirmed",
            }
          )
          .send();

        const accounts =
          response.value as unknown as ParsedTokenAccount[];

        const raw = accounts.reduce(
          (total, tokenAccount) =>
            total +
            BigInt(
              tokenAccount.account.data.parsed.info.tokenAmount.amount
            ),
          0n
        );

        if (cancelled) return;

        const formattedBalance =
          Number(raw) / 10 ** USDC_DECIMALS;

        setRawBalance(raw.toString());
        setBalance(formattedBalance);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load USDC balance:", err);

        setBalance(0);
        setRawBalance("0");
        setError(err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [client, owner]);

  return {
    balance,
    rawBalance,
    isLoading,
    error,
  };
}