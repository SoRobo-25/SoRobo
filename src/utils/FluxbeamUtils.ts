import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { FLUXBEAM_BASE_URI } from "../constants";
import { base64 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { FluxbeamServerResponse } from "../types";
import {
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

// handles the case where a token in the pool is a token 2022 token
export async function getTokenDecimals(
  agent: SolanaAgentKit,
  mint: PublicKey,
): Promise<number> {
  try {
    return (
      await getMint(agent.connection, mint, "finalized", TOKEN_PROGRAM_ID)
    ).decimals;
  } catch (error) {
    try {
      return (
        await getMint(
          agent.connection,
          mint,
          "finalized",
          TOKEN_2022_PROGRAM_ID,
        )
      ).decimals;
    } catch (finalError: any) {
      throw new Error(
        `Failed to fetch mint info for token ${mint.toBase58()}: ${finalError.message}`,
      );
    }
  }
}

// Function to sign the transaction
export async function signTransaction(
  agent: SolanaAgentKit,
  transaction: Transaction,
  additional_signers: Keypair[] = [],
) {
  transaction.feePayer = agent.wallet_address;
  transaction.recentBlockhash = (
    await agent.connection.getLatestBlockhash()
  ).blockhash;

  transaction.sign(agent.wallet, ...additional_signers); // Sign the transaction

  // Serialize the transaction
  const serializedTransaction = transaction.serialize();

  // Encode the serialized transaction to a base64 string
  const base64Transaction = base64.encode(serializedTransaction);

  return base64Transaction;
}

//send the transaction to the fluxbeam endpoint
// bwmkt is a query param meaning "bandwidth market" and is set to true
export async function sendTransaction(
  agent: SolanaAgentKit,
  transaction: string,
): Promise<FluxbeamServerResponse> {
  const endpoint =
    "https://api.fluxbeam.xyz/v1/solana/sendTransaction?bwmkt=true";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: agent.wallet_address,
        transaction: transaction,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resp = await response.json();

    // eslint-disable-next-line no-console
    console.log(`https://solana.fm/tx/${resp.signature}`);

    return resp;
  } catch (error) {
    throw Error(`Error sending transaction: ${error}`);
  }
}

export function uri(endpoint: string) {
  return `${FLUXBEAM_BASE_URI}/${endpoint}`;
}
