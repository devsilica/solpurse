import { address, type Address } from "@solana/kit";

export const USDC_MINT = address(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const USDC_DECIMALS = 6;

export function parseUsdcAmount(
  value: string,
  balance: number
): { amount: bigint; error?: string } {
  const input = value.trim();

  if (!input) {
    return { amount: 0n, error: "Enter an amount." };
  }

  if (!/^\d+(\.\d{1,6})?$/.test(input)) {
    return {
      amount: 0n,
      error: "Enter a valid USDC amount with up to 6 decimal places.",
    };
  }

  const [whole, fraction = ""] = input.split(".");

  const paddedFraction = fraction.padEnd(USDC_DECIMALS, "0");

  const rawAmount =
    BigInt(whole) * 1_000_000n + BigInt(paddedFraction || "0");

  if (rawAmount <= 0n) {
    return { amount: 0n, error: "Amount must be greater than 0." };
  }

  const balanceRaw = BigInt(
    Math.round(balance * 10 ** USDC_DECIMALS)
  );

  if (rawAmount > balanceRaw) {
    return { amount: 0n, error: "Insufficient USDC balance." };
  }

  return {
    amount: rawAmount,
  };
}

export function parseSolanaAddress(
  value: string
): { address?: Address; error?: string } {
  const input = value.trim();

  if (!input) {
    return { error: "Enter a recipient address." };
  }

  try {
    return {
      address: address(input),
    };
  } catch {
    return {
      error: "Enter a valid Solana wallet address.",
    };
  }
}