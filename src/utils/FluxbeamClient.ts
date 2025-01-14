import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SolanaAgentKit } from "../agent";
import { FLUXBEAM_BASE_URI } from "../constants";
import { base64 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { FluxbeamServerResponse } from "../types";
import fs from "fs/promises";
import path from "path";
import { createGenericFile, Umi } from "@metaplex-foundation/umi";

/**
 * Returns the token mints account for a given user
 * @param owner
 * @param mint
 * @param program
 * @param allowOwnerOffCurve
 */
export async function getAssociatedTokenPDA(
  mint: PublicKey,
  owner: PublicKey,
  program = TOKEN_2022_PROGRAM_ID,
  allowOwnerOffCurve = false,
) {
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    program,
  );
}

export async function accountExists(agent: SolanaAgentKit, account: PublicKey) {
  const acc = await agent.connection
    .getAccountInfo(account, "confirmed")
    .catch((e) => {});
  return !!acc;
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

    console.log(`https://solscan.io/tx/${resp.signature}`);

    return resp;
  } catch (error) {
    throw Error(`Error sending transaction: ${error}`);
  }
}

// export async function signAndSendTransaction() {}

export async function uploadImage(umi: Umi, filePath: string): Promise<string> {
  // Resolve the absolute path to the file relative to the current working directory
  const absoluteFilePath = path.resolve(process.cwd(), filePath);
  // Read the file asynchronously
  const buffer = await fs.readFile(absoluteFilePath);

  const file = createGenericFile(buffer, path.basename(absoluteFilePath), {
    contentType: "image/jpeg",
  });
  const [imageUri] = await umi.uploader.upload([file]);

  return imageUri;
}

export function uri(endpoint: string) {
  return `${FLUXBEAM_BASE_URI}/${endpoint}`;
}
