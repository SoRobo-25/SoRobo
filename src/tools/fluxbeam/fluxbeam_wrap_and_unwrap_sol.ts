import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SolanaAgentKit } from "../../agent";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKENS } from "../../constants";
import { sendTransaction, signTransaction } from "../../utils/FluxbeamClient";

export async function getWrapSOLInstructions(
  agent: SolanaAgentKit,
  owner: PublicKey,
  amount: number,
): Promise<TransactionInstruction[]> {
  try {
    const ixs: TransactionInstruction[] = [];
    const amountInLamports = amount * LAMPORTS_PER_SOL;

    const ata = getAssociatedTokenAddressSync(TOKENS.wSOL, owner, true);
    const ataInfo = await agent.connection
      .getTokenAccountBalance(ata)
      .catch(() => null);
    const userBalanceInLamports = await agent.connection.getBalance(owner);

    const currentWSOLBalance = ataInfo ? Number(ataInfo.value.amount) : 0;

    if (currentWSOLBalance >= amountInLamports) {
      return ixs;
    }
    // if the amount of WSOL already in the wallet is more than the amount we want to wrap then we return
    // an empty array of instructions
    if (!ataInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(owner, ata, owner, TOKENS.wSOL),
      );
    }

    const requiredLamports = amountInLamports - currentWSOLBalance;
    if (requiredLamports > 0) {
      if (requiredLamports > userBalanceInLamports) {
        throw new Error(
          "Insufficient SOL balance to wrap the requested amount.",
        );
      }

      // Add transfer and sync instructions
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: ata,
          lamports: requiredLamports,
        }),
        createSyncNativeInstruction(ata),
      );
    }
    return ixs;
  } catch (error: any) {
    throw new Error(
      `Failed to generate wrap SOL instructions: ${error.message}`,
    );
  }
}

export async function getUnwrapSOLInstructions(
  agent: SolanaAgentKit,
  owner: PublicKey,
  amount: number, // Amount in SOL (not lamports)
): Promise<TransactionInstruction[]> {
  try {
    const ixs: TransactionInstruction[] = [];
    const amountInLamports = amount * LAMPORTS_PER_SOL;

    const ata = getAssociatedTokenAddressSync(TOKENS.wSOL, owner, true);
    //convert all the WSOL back to sol
    const wsolBalance = await agent.connection
      .getTokenAccountBalance(TOKENS.wSOL) // prob in lamports
      .then((val) => {
        if (!val?.value?.uiAmount) {
          throw new Error("Failed to fetch wSOL balance");
        }
        return val.value.uiAmount;
      });
    if (wsolBalance === null || 0) {
      throw Error("You have no WSOL to unwrap");
    }
    if (amount === wsolBalance) {
      ixs.push(createCloseAccountInstruction(ata, owner, owner));
    } else {
      ixs.push(createCloseAccountInstruction(ata, owner, owner));

      const amountToWrap = wsolBalance - amountInLamports;
      const instructions = await getWrapSOLInstructions(
        agent,
        agent.wallet_address,
        amountToWrap,
      );
      ixs.push(...instructions);
    }
    return ixs;
  } catch (error: any) {
    throw new Error(
      `Failed to generate unwrap SOL instructions: ${error.message}`,
    );
  }
}

/**
 * Wraps SOL to wSOL for the specified amount
 * @param agent SolanaAgentKit instance
 * @param amount Amount of SOL to wrap (in SOL)
 * @returns Transaction signature
 */
export async function fluxbeamWrapSOL(
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

    const transaction = new Transaction().add(...instructions);

    const txn = await signTransaction(agent, transaction);

    const response = await sendTransaction(agent, txn);

    return response.signature;
  } catch (error: any) {
    throw new Error(`SOL wrapping failed: ${error.message}`);
  }
}

/**
 * Unwraps wSOL back to SOL
 * @param agent SolanaAgentKit instance
 * @returns Transaction signature
 */
export async function fluxbeamUnwrapSOL(
  agent: SolanaAgentKit,
  amount: number,
): Promise<string> {
  try {
    const instructions = await getUnwrapSOLInstructions(
      agent,
      agent.wallet_address,
      amount,
    );

    const transaction = new Transaction().add(...instructions);

    const txn = await signTransaction(agent, transaction);

    const response = await sendTransaction(agent, txn);

    return response.signature;
  } catch (error: any) {
    throw new Error(`SOL unwrapping failed: ${error.message}`);
  }
}
