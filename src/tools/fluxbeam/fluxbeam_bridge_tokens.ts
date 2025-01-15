/* eslint-disable no-console */
import { fetchQuote, swapFromSolana } from "@mayanfinance/swap-sdk";
import { SolanaAgentKit } from "../../agent";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

export enum Chain {
  Ethereum = "ethereum",
  Bsc = "bsc",
  Polygon = "polygon",
  Avalanche = "avalanche",
  Solana = "solana",
  Arbitrum = "arbitrum",
  Optimism = "optimism",
  Base = "base",
}

export const GAS_DROP_LIMITS: Record<Chain, number> = {
  [Chain.Ethereum]: 0.05,
  [Chain.Bsc]: 0.02,
  [Chain.Polygon]: 0.2,
  [Chain.Avalanche]: 0.2,
  [Chain.Solana]: 0.2,
  [Chain.Arbitrum]: 0.01,
  [Chain.Optimism]: 0.01,
  [Chain.Base]: 0.01,
};

/**
 * Bridges tokens from Solana to a destination chain using the Mayan Finance protocol.
 *
 * This function performs a token swap from Solana to another blockchain (Ethereum, BSC, Polygon, etc.).
 * It fetches a quote for the swap, signs the transaction, and then initiates the swap.
 *
 * @param {SolanaAgentKit} agent - The agent responsible for the Solana wallet and network connection.
 * @param {Chain} destination - The destination blockchain to which the tokens are being swapped.
 * @param {string} destinationWalletAddress - The wallet address on the destination chain to receive the tokens.
 * @param {string} fromToken - The token address to be swapped from.
 * @param {string} toToken - The token address to be swapped to.
 * @param {number} [gasDrop] - The optional gas drop to be applied to the transaction. Must not exceed the limit for the source chain.
 *
 * @throws {Error} Throws an error if the gas drop exceeds the source chain's limit.
 * @throws {Error} Throws an error if the transaction type is invalid during signing.
 *
 * @returns {Promise<string>} A promise that resolves to the transaction signature of the initiated swap.
 *
 */

export async function fluxbeamBridgeTokens(
  agent: SolanaAgentKit,
  destination: Chain,
  destinationWalletAddress: string,
  fromToken: string,
  toToken: string,
  amount: number,
  gasDrop?: number,
): Promise<string> {
  async function signer(trx: Transaction): Promise<Transaction>;
  async function signer(
    trx: VersionedTransaction,
  ): Promise<VersionedTransaction>;
  async function signer(
    trx: Transaction | VersionedTransaction,
  ): Promise<Transaction | VersionedTransaction> {
    if ("version" in trx) {
      (trx as VersionedTransaction).sign([agent.wallet]);
    } else {
      (trx as Transaction).partialSign(agent.wallet);
    }
    return trx;
  }
  try {
    // Validate gas drop
    if (gasDrop !== undefined && gasDrop > GAS_DROP_LIMITS[destination]) {
      throw new Error(
        `Gas drop for ${destination} cannot exceed ${GAS_DROP_LIMITS[destination]}`,
      );
    }

    const quotes = await fetchQuote({
      amount: amount,
      fromToken: fromToken,
      toToken: toToken,
      fromChain: Chain.Solana,
      toChain: destination,
      slippageBps: 50, // means 3%
      // gasDrop: gasDrop ?? 0.04, // optional
      referrerBps: 5, // optional
    });
    for (const quote of quotes) {
      console.log(quote);
    }

    //just pass the fn the txn object that it uses is internally implemented
    const swapTrx = await swapFromSolana(
      quotes[0],
      agent.wallet_address.toString(),
      destinationWalletAddress,
      null,
      signer,
      agent.connection,
    );

    console.log("Swap initiated! Transaction signature:", swapTrx.signature);

    // You can track the swap status using the Mayan Explorer API
    console.log(
      "Track your swap at:",
      `https://explorer.mayan.finance/tx/${swapTrx.signature}`,
    );

    return swapTrx.signature;
  } catch (error: any) {
    throw Error(`Bridging failed: ${error.message}`);
  }
}
