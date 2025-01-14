import { web3 } from "@coral-xyz/anchor";
import { SolanaAgentKit } from "../agent";
import {
  createAssociatedTokenAccountInstruction,
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromAccountsInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {
  accountExists,
  getAssociatedTokenPDA,
  sendTransaction,
  signTransaction,
} from "../utils/FluxbeamClient";
import { PublicKey, Transaction } from "@solana/web3.js";

/**
 * Returns array of transactions needed to claim all withheld tokens for a given mint
 * @agent SolanaAgentKit instance
 * @param mint
 * @param payer
 * @param authority
 * @param srcAccounts
 */
export async function fluxbeamGetClaimWitheldTokens(
  agent: SolanaAgentKit,
  mint: PublicKey,
  authority: PublicKey,
  srcAccounts: PublicKey[],
  payer?: PublicKey,
): Promise<string[]> {
  try {
    const signatures: string[] = [];

    //Get destination account
    const dstAcc = await getAssociatedTokenPDA(
      mint,
      payer || agent.wallet_address,
      TOKEN_2022_PROGRAM_ID,
    );

    if (!(await accountExists(agent, dstAcc))) {
      const transaction = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 42_000 }),
        createAssociatedTokenAccountInstruction(
          payer || agent.wallet_address,
          dstAcc,
          payer || agent.wallet_address,
          mint,
          TOKEN_2022_PROGRAM_ID,
        ),
      );

      //Withdraw from mint account too
      transaction.add(
        createWithdrawWithheldTokensFromMintInstruction(
          mint,
          dstAcc,
          payer || agent.wallet_address,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),
      );

      // Sign and send the transaction
      const signature = await signTransaction(agent, transaction);

      await sendTransaction(agent, signature);

      signatures.push(signature);
    } else {
      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
        createWithdrawWithheldTokensFromMintInstruction(
          mint,
          dstAcc,
          agent.wallet_address,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),
      );
      // Sign and send the transaction
      const signature = await signTransaction(agent, transaction);

      await sendTransaction(agent, signature);

      signatures.push(signature);
    }

    for (let i = 0; i < srcAccounts.length; i += 30) {
      const transaction = new Transaction().add(
        createWithdrawWithheldTokensFromAccountsInstruction(
          mint,
          dstAcc,
          authority,
          [],
          srcAccounts.slice(i, i + 30),
          TOKEN_2022_PROGRAM_ID,
        ),
      );

      // Sign and send the transaction
      const signature = await signTransaction(agent, transaction);

      await sendTransaction(agent, signature);

      signatures.push(signature);
    }
    return signatures;
  } catch (error: any) {
    throw new Error(`Failed to claim withheld tokens: ${error.message}`);
  }
}

/**
 * Returns transaction to claim withheld tokens from the mint account
 * @agent SolanaAgentKit instance
 * @param mint Token mint address
 * @param payer
 * @returns Transaction signature
 */
export async function fluxbeamGetClaimWitheldTokensFromMint(
  agent: SolanaAgentKit,
  mint: PublicKey,
  payer?: PublicKey,
) {
  try {
    //get destination acc
    const dstAcc = await getAssociatedTokenPDA(
      mint,
      payer || agent.wallet_address,
      TOKEN_2022_PROGRAM_ID,
    );
    const transaction = new Transaction();

    if (!(await accountExists(agent, dstAcc))) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 42_000 }),
        createAssociatedTokenAccountInstruction(
          payer || agent.wallet_address,
          dstAcc,
          payer || agent.wallet_address,
          mint,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    } else {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
      );
    }

    //Withdraw from mint account too
    transaction.add(
      createWithdrawWithheldTokensFromMintInstruction(
        mint,
        dstAcc,
        payer || agent.wallet_address,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    // Sign and send the transaction
    const signature = await signTransaction(agent, transaction);

    await sendTransaction(agent, signature);

    return signature;
  } catch (error: any) {
    throw new Error(`Failed to claim tokens from mint: ${error.message}`);
  }
}

/**
 * Harvests withheld tokens to mint (permissionless)
 * @param agent SolanaAgentKit instance
 * @param mint Token mint address
 * @param srcAccounts Source accounts to harvest from
 * @returns Array of transaction signatures
 */
export async function fluxbeamGetClaimWithheldTokensToMint(
  agent: SolanaAgentKit,
  mint: PublicKey,
  srcAccounts: PublicKey[],
) {
  try {
    const signatures = [];

    for (let i = 0; i < srcAccounts.length; i += 30) {
      const transaction = new Transaction().add(
        createHarvestWithheldTokensToMintInstruction(
          mint,
          srcAccounts.slice(i, i + 30),
        ),
      );

      // Sign and send the transaction
      const signature = await signTransaction(agent, transaction);

      await sendTransaction(agent, signature);

      signatures.push(signature);
    }
    return signatures;
  } catch (error: any) {
    throw new Error(`Failed to harvest tokens to mint: ${error.message}`);
  }
}
