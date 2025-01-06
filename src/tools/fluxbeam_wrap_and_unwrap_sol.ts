import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../agent";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKENS } from "../constants";
import { makeAndSendAndConfirmTransaction } from "../utils/fluxbeam_utils";

export async function getWrapSOLInstructions(
  agent: SolanaAgentKit,
  owner: PublicKey,
  amount: number,
): Promise<TransactionInstruction[]> {
  const ixs: TransactionInstruction[] = [];
  const ata = getAssociatedTokenAddressSync(TOKENS.wSOL, owner, true);
  const ataInfo = await agent.connection
    .getTokenAccountBalance(ata)
    .catch(() => {});

  if (ataInfo) {
    if (Number(ataInfo?.value.amount) >= amount) {
      return ixs;
    }
  }

  if (!ataInfo) {
    ixs.push(
      createAssociatedTokenAccountInstruction(owner, ata, owner, TOKENS.wSOL),
    );
  }
  if (amount > 0) {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: ata,
        lamports: amount - Number(ataInfo?.value.amount || 0),
      }),
      createSyncNativeInstruction(ata),
    );
  }

  return ixs;
}

export function getUnwrapSOLInstruction(
  owner: PublicKey,
): TransactionInstruction {
  const ata = getAssociatedTokenAddressSync(TOKENS.wSOL, owner, true);
  return createCloseAccountInstruction(ata, owner, owner);
}

/**
 * Wraps SOL to wSOL for the specified amount
 * @param agent SolanaAgentKit instance
 * @param amount Amount of SOL to wrap (in lamports)
 * @returns Transaction signature
 */
export async function wrapSOL(
  agent: SolanaAgentKit,
  amount: number,
): Promise<string> {
  try {
    const instructions = await getWrapSOLInstructions(
      agent,
      agent.wallet_address,
      amount,
    );

    if (instructions.length === 0) {
      throw new Error("No wrap instructions needed");
    }

    return await makeAndSendAndConfirmTransaction(
      agent.connection,
      instructions,
      [agent.wallet],
      agent.wallet,
    );
  } catch (error: any) {
    throw new Error(`SOL wrapping failed: ${error.message}`);
  }
}

/**
 * Unwraps wSOL back to SOL
 * @param agent SolanaAgentKit instance
 * @returns Transaction signature
 */
export async function unwrapSOL(agent: SolanaAgentKit): Promise<string> {
  try {
    const instruction = getUnwrapSOLInstruction(agent.wallet_address);

    return await makeAndSendAndConfirmTransaction(
      agent.connection,
      [instruction],
      [agent.wallet],
      agent.wallet,
    );
  } catch (error: any) {
    throw new Error(`SOL unwrapping failed: ${error.message}`);
  }
}
