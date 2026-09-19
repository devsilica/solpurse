"use client";

import { useEffect, useState } from "react";
import { address, type Address } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";

import { WalletButton } from "./components/wallet-button";
import { useAppClient } from "./lib/client-provider";
import { useUsdcBalance } from "./lib/hooks/use-usdc-balance";
import { useSendUsdc } from "./lib/hooks/use-send-usdc";
import { parseSolanaAddress, parseUsdcAmount } from "./lib/usdc";

export default function Home() {
  const client = useAppClient();
  const connected = useConnectedWallet(client);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletAddress: Address | undefined = connected?.account.address
    ? address(connected.account.address)
    : undefined;

  const { balance, isLoading, error } = useUsdcBalance(walletAddress);

  const {
    sendUsdc,
    status: sendStatus,
    isSending,
  } = useSendUsdc();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);

  const displayBalance = isLoading
    ? "..."
    : error
      ? "—"
      : balance.toFixed(2);

  function handleContinue() {
    setFormError("");

    if (!walletAddress) {
      setFormError("Connect your wallet first.");
      return;
    }

    const recipientResult = parseSolanaAddress(recipient);

    if (recipientResult.error) {
      setFormError(recipientResult.error);
      return;
    }

    if (recipientResult.address === walletAddress) {
      setFormError("You can't send USDC to your own wallet.");
      return;
    }

    const amountResult = parseUsdcAmount(amount, balance);

    if (amountResult.error) {
      setFormError(amountResult.error);
      return;
    }

    setIsReviewing(true);
  }

  function handleBack() {
    if (isSending) return;

    setIsReviewing(false);
    setFormError("");
  }

  async function handleApprove() {
    setFormError("");

    if (!walletAddress) {
      setFormError("Connect your wallet first.");
      return;
    }

    const recipientResult = parseSolanaAddress(recipient);

    if (recipientResult.error) {
      setFormError(recipientResult.error);
      return;
    }

    if (recipientResult.address === walletAddress) {
      setFormError("You can't send USDC to your own wallet.");
      return;
    }

    const amountResult = parseUsdcAmount(amount, balance);

    if (amountResult.error) {
      setFormError(amountResult.error);
      return;
    }

    const result = await sendUsdc(recipient, amountResult.amount);

    if (result.error || !result.signature) {
      setFormError(
        result.error ?? "Transaction could not be completed. Please try again."
      );
      return;
    }

    setTransactionSignature(result.signature);
    setIsComplete(true);
  }

  function resetTransfer() {
    setIsComplete(false);
    setTransactionSignature(null);
    setRecipient("");
    setAmount("");
    setIsReviewing(false);
    setFormError("");
  }

  function getApproveButtonLabel() {
    if (sendStatus === "signing") {
      return "Waiting for approval...";
    }

    if (sendStatus === "confirming") {
      return "Confirming transaction...";
    }

    return "Approve";
  }

  if (isComplete && transactionSignature) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold tracking-tight">
                SolPurse
              </div>

              <div className="text-xs text-muted-foreground">
                Move digital money simply.
              </div>
            </div>

            <WalletButton />
          </header>

          <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
                  ✓
                </div>

                <h1 className="mt-4 text-xl font-semibold">
                  Transaction confirmed
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Your USDC transfer was confirmed on Solana Devnet.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">
                    Amount
                  </div>

                  <div className="mt-1 text-lg font-semibold">
                    {amount} USDC
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">
                    Recipient
                  </div>

                  <div className="mt-1 break-all font-mono text-xs leading-relaxed">
                    {recipient}
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">
                    Transaction
                  </div>

                  <div className="mt-1 break-all font-mono text-xs leading-relaxed">
                    {transactionSignature}
                  </div>
                </div>
              </div>

              <a
                href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                View on Solana Explorer
              </a>

              <button
                type="button"
                onClick={resetTransfer}
                className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Send another
              </button>
            </div>
          </section>

          <footer className="py-4 text-center text-xs text-muted-foreground">
            Built on Solana Devnet
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold tracking-tight">
              SolPurse
            </div>

            <div className="text-xs text-muted-foreground">
              Move digital money simply.
            </div>
          </div>

          <WalletButton />
        </header>

        <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">
              Your balance
            </div>

            <div
              className="mt-2 text-4xl font-bold tracking-tight"
              aria-live="polite"
              aria-label={`USDC balance: ${displayBalance}`}
            >
              {displayBalance}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              USDC
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {!isReviewing ? (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-semibold tracking-tight">
                    Send USDC
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Send USDC directly to another Solana wallet.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="recipient"
                      className="mb-2 block text-sm font-medium"
                    >
                      Recipient
                    </label>

                    <input
                      id="recipient"
                      type="text"
                      value={recipient}
                      onChange={(event) => {
                        setRecipient(event.target.value);
                        setFormError("");
                      }}
                      placeholder="Solana wallet address"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-2 block text-sm font-medium"
                    >
                      Amount
                    </label>

                    <div className="relative">
                      <input
                        id="amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => {
                          setAmount(event.target.value);
                          setFormError("");
                        }}
                        placeholder="0.00"
                        autoComplete="off"
                        className="w-full rounded-xl border bg-background px-4 py-3 pr-16 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        USDC
                      </span>
                    </div>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {formError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!mounted || !walletAddress || isLoading}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-semibold tracking-tight">
                    Review transfer
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Check the details before approving the transaction.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border bg-background p-4">
                    <div className="text-xs text-muted-foreground">
                      Recipient
                    </div>

                    <div className="mt-1 break-all font-mono text-sm">
                      {recipient}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background p-4">
                    <div className="text-xs text-muted-foreground">
                      Amount
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {amount} USDC
                    </div>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSending}
                      className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSending}
                      className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {getApproveButtonLabel()}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="py-4 text-center text-xs text-muted-foreground">
          Built on Solana Devnet
        </footer>
      </div>
    </main>
  );
}