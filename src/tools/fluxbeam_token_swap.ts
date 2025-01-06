import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../index";
import { TOKENS, DEFAULT_OPTIONS } from "../constants";
import { getMint } from "@solana/spl-token";

/**
 * Swap tokens using FluxBeam DEX
 * @param agent SolanaAgentKit instance
 * @param outputMint Target token mint address
 * @param inputAmount Amount to swap (in token decimals)
 * @param inputMint Source token mint address (defaults to USDC)
 * @param slippageBps Slippage tolerance in basis points (default: 300 = 3%)
 * @returns Transaction signature
 */
export async function fluxBeamSwap(
  agent: SolanaAgentKit,
  outputMint: PublicKey,
  inputAmount: number,
  inputMint: PublicKey = TOKENS.USDC,
  slippageBps: number = DEFAULT_OPTIONS.SLIPPAGE_BPS,
): Promise<string> {
  try {
    // Check if input token is native SOL
    const isNativeSol = inputMint.equals(TOKENS.SOL);

    // For native SOL, we use LAMPORTS_PER_SOL, otherwise fetch mint info
    const inputDecimals = isNativeSol
      ? 9 // SOL always has 9 decimals
      : (await getMint(agent.connection, inputMint)).decimals;

    // Calculate the correct amount based on actual decimals
    const scaledAmount = inputAmount * Math.pow(10, inputDecimals);

    const FLUXBEAM_API = `https://api.fluxbeam.xyz/v1`;
    const quoteResponse = await (
      await fetch(
        `${FLUXBEAM_API}/quote?` +
          `inputMint=${isNativeSol ? TOKENS.SOL.toString() : inputMint.toString()}` +
          `&outputMint=${outputMint.toString()}` +
          `&amount=${scaledAmount}` +
          `&slippageBps=${slippageBps}`,
      )
    ).json();

    console.log(quoteResponse);
    const response = await (
      await fetch(`${FLUXBEAM_API}/swap/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: agent.wallet_address.toString(),
          wrapAndUnwrapSol: true,
        }),
      })
    ).json();
    console.log(response);
    // Deserialize transaction
    const swapTransactionBuf = Buffer.from(response.transaction, "base64");

    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    // Sign and send transaction
    transaction.sign([agent.wallet]);

    const signature = agent.connection.sendRawTransaction(
      transaction.serialize(),
      {
        maxRetries: 3,
        skipPreflight: true,
      },
    );
    return signature;
  } catch (error: any) {
    throw new Error(`Swap failed: ${error.message}`);
  }
}
