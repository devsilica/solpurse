"use client";

import { useCallback, useState } from "react";
import { address, type Address } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";

import { useAppClient } from "../client-provider";
import { USDC_MINT } from "../usdc";

const USDC_DECIMALS = 6;

export type SendStatus =
  | "idle"
  | "signing"
  | "confirming"
  | "confirmed"
  | "error";

function getSendErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("user rejected") ||
      message.includes("user declined") ||
      message.includes("rejected the request")
    ) {
      return "Transaction cancelled in your wallet.";
    }

    if (
      message.includes("insufficient funds") ||
      message.includes("insufficient lamports")
    ) {
      return "Not enough SOL to pay the transaction fee.";
    }

    if (
      message.includes("insufficient token") ||
      message.includes("insufficient funds for transfer")
    ) {
      return "You don't have enough USDC for this transfer.";
    }

    if (message.includes("blockhash") || message.includes("expired")) {
      return "The transaction expired. Please try again.";
    }

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("failed to fetch")
    ) {
      return "Network error. Check your connection and try again.";
    }

    return error.message;
  }

  return "Something went wrong while sending USDC. Please try again.";
}

type SendUsdcResult =
  | {
      signature: string;
      error: null;
    }
  | {
      signature: null;
      error: string;
    };

export function useSendUsdc() {
  const client = useAppClient();
  const connected = useConnectedWallet(client);

  const [status, setStatus] = useState<SendStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const sendUsdc = useCallback(
    async (
      recipient: string,
      amount: bigint
    ): Promise<SendUsdcResult> => {
      setStatus("signing");
      setError(null);
      setSignature(null);

      try {
        if (!connected) {
          throw new Error("Connect your wallet first.");
        }

        if (!connected.signer) {
          throw new Error(
            "Your wallet is connected but is not ready to sign transactions."
          );
        }

        const recipientAddress: Address = address(recipient);

        if (amount <= 0n) {
          throw new Error("Amount must be greater than 0.");
        }

        const result = await client.token.instructions
          .transferToATA({
            mint: USDC_MINT,
            authority: connected.signer,
            recipient: recipientAddress,
            amount,
            decimals: USDC_DECIMALS,
          })
          .sendTransaction();

        const transactionSignature = result.context.signature;

        setSignature(transactionSignature);
        setStatus("confirming");

        setStatus("confirmed");

        return {
          signature: transactionSignature,
          error: null,
        };
      } catch (err) {
        console.error("Failed to send USDC:", err);

        const message = getSendErrorMessage(err);

        setError(message);
        setStatus("error");

        return {
          signature: null,
          error: message,
        };
      }
    },
    [client, connected]
  );

  const isSending =
    status === "signing" || status === "confirming";

  return {
    sendUsdc,
    status,
    isSending,
    error,
    signature,
  };
}