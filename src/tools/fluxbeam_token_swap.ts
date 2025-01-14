import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Quote, SolanaAgentKit, TransformedResponse } from "../index";
import { TOKENS, DEFAULT_OPTIONS } from "../constants";
import { getMint } from "@solana/spl-token";
import { Console } from "console";
import { sendTransaction, signTransaction } from "../utils/FluxbeamClient";

function transformResponse(response: { quote: Quote }): Quote {
  // Destructure the input object to get the quote object
  const {
    program,
    pool,
    inputMint,
    outputMint,
    amountIn,
    outAmount,
    minimumOut,
  } = response.quote;

  // Return a new quote object with the arguments in the desired order
  return {
    amountIn,
    inputMint,
    minimumOut,
    outAmount,
    outputMint,
    pool,
    program,
  };
}

/**
 * Swap tokens using FluxBeam DEX
 * @param agent SolanaAgentKit instance
 * @param inputMint Source token mint address (defaults to USDC)
 * @param outputMint Target token mint address
 * @param inputAmount Amount to swap (in token decimals)
 * @param slippageBps Slippage tolerance in basis points (default: 300 = 3%)
 * @returns Transaction signature
 */
export async function fluxBeamSwap(
  agent: SolanaAgentKit,
  inputMint: PublicKey,
  outputMint: PublicKey,
  inputAmount: number,
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
          `inputMint=${inputMint.toString()}` +
          `&outputMint=${outputMint.toString()}` +
          `&amount=${scaledAmount}` +
          `&slippageBps=${slippageBps}`,
      )
    ).json();

    const quote = transformResponse(quoteResponse);
    // console.log(quote);
    const response = await (
      await fetch(`${FLUXBEAM_API}/swap/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priorityFeeLamports: 100000,
          quote,
          userPublicKey: agent.wallet_address.toString(),
          wrapAndUnwrapSol: true,
        }),
      })
    ).json();
    console.log(`this is the transaction response ${response.transaction}`);
    // Deserialize transaction
    const swapTransactionBuf = Buffer.from(response.transaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    console.log("Transaction", transaction);
    // Sign and send transaction
    transaction.sign([agent.wallet]);

    const signature = await agent.connection.sendRawTransaction(
      transaction.serialize(),
      {
        maxRetries: 3,
        skipPreflight: true,
      },
    );
    // const txn = await signTransaction(agent, response.transaction);

    // const resp = await sendTransaction(txn);

    // return response.signature;

    return signature;
  } catch (error: any) {
    throw new Error(`Swap failed: ${error.message}`);
  }
}
