import { describe, expect, it } from "vitest";

import {
  parseSolanaAddress,
  parseUsdcAmount,
} from "../app/lib/usdc";

describe("SolPurse", () => {
  it("accepts a valid Solana recipient address", () => {
    const result = parseSolanaAddress(
      "6GMHix13e54w1ns8539LhAt1Y6YrW3MrjmMbgdS4EhJc"
    );

    expect(result.error).toBeUndefined();
    expect(result.address).toBeDefined();
  });

  it("rejects an invalid Solana recipient address", () => {
    const result = parseSolanaAddress("not-a-wallet");

    expect(result.address).toBeUndefined();
    expect(result.error).toBe("Enter a valid Solana wallet address.");
  });

  it("parses a valid USDC amount", () => {
    const result = parseUsdcAmount("2.5", 20);

    expect(result.error).toBeUndefined();
    expect(result.amount).toBe(2_500_000n);
  });

  it("rejects an amount greater than the balance", () => {
    const result = parseUsdcAmount("25", 20);

    expect(result.amount).toBe(0n);
    expect(result.error).toBe("Insufficient USDC balance.");
  });
});