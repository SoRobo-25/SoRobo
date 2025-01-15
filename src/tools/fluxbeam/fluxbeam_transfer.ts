import { SolanaAgentKit } from "../../agent";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";
import {
  getAssociatedTokenPDA,
  sendTransaction,
  signTransaction,
} from "../../utils/FluxbeamClient";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
/**
 * Transfers SPL tokens from the agent's wallet to a destination wallet.
 *
 * By default, this function uses the `TOKEN_2022_PROGRAM_ID` program to handle
 * transfers for tokens adhering to the Token-2022 specification. It also handles
 * creating the destination's associated token account (ATA) if it doesn't already exist.
 *
 * @param agent - The SolanaAgentKit instance for interacting with Solana.
 * @param mint - The public key of the SPL token mint.
 * @param dstOwner - The public key of the destination wallet.
 * @param amount - The number of tokens to transfer (unscaled by decimals).
 * @param v2 - the token type to transfer , v2 is set to true by default meaning we are transferring TOKEN 2022 (or v2) tokens
 * @param allowOwnerOffCurve - Whether the owner can be an off-curve public key (defaults to false).
 * @returns The signature of the submitted transaction.
 * @throws If there is an error during the transfer or account creation process.
 */
export async function fluxbeamTransferSplToken(
  agent: SolanaAgentKit,
  mint: PublicKey,
  dstOwner: PublicKey,
  amount: number,
  v2: boolean = true,
  allowOwnerOffCurve = false,
) {
  const program = v2 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const decimals = (await getMint(agent.connection, mint, "finalized", program))
    .decimals;

  const srcAta = await getAssociatedTokenPDA(
    mint,
    agent.wallet_address,
    program,
    allowOwnerOffCurve,
  );
  const dstAta = await getAssociatedTokenPDA(
    mint,
    dstOwner,
    program,
    allowOwnerOffCurve,
  );
  const transaction = new Transaction();

  const dstIfo = await agent.connection.getAccountInfo(dstAta, "confirmed");
  if (!dstIfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        agent.wallet_address,
        dstAta,
        dstOwner,
        mint,
        program,
      ),
    );
  }
  transaction.add(
    createTransferCheckedInstruction(
      srcAta, //Src Ata
      mint, //Mint
      dstAta,
      agent.wallet_address,
      amount * Math.pow(10, decimals),
      decimals,
      [],
      program,
    ),
  );

  const txn = await signTransaction(agent, transaction);

  const response = await sendTransaction(agent, txn);

  return response.signature;
}

/**
 * Transfers SOL (native token) from the agent's wallet to a destination wallet.
 *
 * This function creates and signs a transaction that transfers a specified amount
 * of SOL from the agent to the destination wallet. The amount is specified in SOL
 * and converted to lamports internally.
 *
 * @param agent - The SolanaAgentKit instance for interacting with Solana.
 * @param dstOwner - The public key of the destination wallet.
 * @param amount - The amount of SOL to transfer (in SOL, not lamports).
 * @returns The signature of the submitted transaction.
 * @throws If there is an error during the transfer process.
 */
export async function fluxbeamTransferSol(
  agent: SolanaAgentKit,
  dstOwner: PublicKey,
  amount: number,
) {
  try {
    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: agent.wallet_address,
        toPubkey: dstOwner,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );

    const txn = await signTransaction(agent, transaction);

    const response = await sendTransaction(agent, txn);

    return response.signature;
  } catch (error: any) {
    throw new Error(`failed to tranfer Sol ${error.message}`);
  }
}
