/* eslint-disable no-console */
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
  getMint,
} from "@solana/spl-token";
import * as fs from "fs";
import {
  getAssociatedTokenPDA,
  sendTransaction,
  signTransaction,
} from "../../utils/FluxbeamClient";
import { SolanaAgentKit } from "../../agent";
import path from "path";
import { FEE_ACCOUNT } from "../../constants";

interface TokenInfo {
  sendableAmount: number;
  sendableTokenMint: string;
  owner: string;
}

interface AirdropResult {
  success: boolean;
  txid?: string;
  error?: string;
  address?: string;
}
class AirdropError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "AirdropError";
  }
}

type AmountType = "fixed" | "dynamic";
type TargetType = "tokenHolders" | "manual" | "csv";

/**
 * Signs and sends a token transfer transaction
 * @param agent SolanaAgentKit instance
 * @param dropInfo Token transfer information
 * @param sender Sender's keypair
 * @param priorityFee
 * @returns Transaction signature
 */
async function sendToken(
  agent: SolanaAgentKit,
  dropInfo: TokenInfo,
  sender: Keypair,
  priorityFee: number,
): Promise<string> {
  if (
    !dropInfo.sendableAmount ||
    !dropInfo.sendableTokenMint ||
    !dropInfo.owner
  ) {
    throw new Error("Invalid drop info provided");
  }

  const mint = new PublicKey(dropInfo.sendableTokenMint);
  const owner = new PublicKey(dropInfo.owner);
  const decimals = (
    await getMint(agent.connection, mint, "finalized", TOKEN_2022_PROGRAM_ID)
  ).decimals;
  const transaction = new Transaction();
  // Add compute budget instructions first
  const unitLimit = 90_000;
  const unitPrice = Math.floor(priorityFee / unitLimit);

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice }),
    SystemProgram.transfer({
      fromPubkey: agent.wallet_address,
      toPubkey: FEE_ACCOUNT,
      lamports: 100,
    }),
  );

  // Get destination ATA
  const destinationAccount = await getAssociatedTokenPDA(mint, owner);

  // Get source ATA
  const sourceAccount = await getAssociatedTokenPDA(mint, sender.publicKey);

  // Check if destination ATA exists
  const destinationAccountInfo =
    await agent.connection.getAccountInfo(destinationAccount);
  const destTokenAccountMissing = !destinationAccountInfo;

  if (destTokenAccountMissing) {
    console.log("Creating token account...");

    const createATAinstruction = createAssociatedTokenAccountInstruction(
      sender.publicKey,
      destinationAccount,
      owner,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    transaction.add(createATAinstruction);
  }

  // Add transfer instruction
  const transferInstruction = createTransferCheckedInstruction(
    sourceAccount,
    mint,
    destinationAccount,
    sender.publicKey,
    dropInfo.sendableAmount * Math.pow(10, decimals),
    decimals,
    [],
    TOKEN_2022_PROGRAM_ID,
  );
  transaction.add(transferInstruction);

  console.log(
    "Sending from",
    sourceAccount.toBase58(),
    "to",
    destinationAccount.toBase58(),
  );

  // Sign and send transaction using the provided logic
  const txn = await signTransaction(agent, transaction);
  const response = await sendTransaction(agent, txn);
  return response.signature;
}

/**
 * Performs a token airdrop on the Solana blockchain
 *
 * @param agent SolanaAgentKit instance
 * @param sender - Keypair of the sender who will fund the airdrop
 * @param mintAddress - The mint address of the token to be airdropped
 * @param amountType - Type of amount distribution: 'fixed' for same amount to all recipients, 'dynamic' for proportional distribution
 * @param amount - Amount of tokens to send (if fixed) or total tokens to distribute (if dynamic)
 * @param targetType - Method to determine recipients: 'tokenHolders' for holders of a specific token, 'manual' for direct address list, 'csv' for addresses from file
 * @param targetValue - Based on targetType:
 *                     - For 'tokenHolders': mint address of token to check holders (string)
 *                     - For 'manual': array of recipient addresses (string[])
 *                     - For 'csv': path to CSV file with 'address' column (string)
 * @param createAssociatedAccounts - Whether to create Associated Token Accounts for recipients if they don't exist
 * @param minBalance - Optional minimum token balance for filtering token holders
 * @returns Promise resolving to array of results for each attempted transfer
 *
 * @throws {AirdropError} When configuration is invalid or airdrop fails
 **/
export async function fluxbeamTokenAirdrop(
  agent: SolanaAgentKit,
  sender: Keypair,
  mintAddress: string,
  amountType: AmountType,
  amount: number,
  targetType: TargetType,
  targetValue: string | string[],
  createAssociatedAccounts: boolean,
  minBalance?: number,
): Promise<AirdropResult[]> {
  try {
    // Validate inputs
    if (amount <= 0) {
      throw new AirdropError("Amount must be greater than 0", "INVALID_AMOUNT");
    }

    try {
      new PublicKey(mintAddress);
    } catch {
      throw new AirdropError("Invalid mint address", "INVALID_MINT");
    }

    // Get target addresses based on type
    let targetAddresses: string[] = [];
    switch (targetType) {
      case "tokenHolders": {
        if (typeof targetValue !== "string") {
          throw new AirdropError(
            "Token holders target requires a mint address string",
            "INVALID_TARGET_VALUE",
          );
        }
        const mint = new PublicKey(targetValue);
        const accounts = await agent.connection.getProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              { dataSize: 165 },
              { memcmp: { offset: 0, bytes: mint.toBase58() } },
            ],
          },
        );

        for (const acc of accounts) {
          try {
            if (minBalance) {
              const balance = await agent.connection.getTokenAccountBalance(
                acc.pubkey,
              );
              if (Number(balance.value.amount) >= minBalance) {
                targetAddresses.push(acc.pubkey.toBase58());
              }
            } else {
              targetAddresses.push(acc.pubkey.toBase58());
            }
          } catch (error: any) {
            console.warn(
              `Failed to check balance for ${acc.pubkey.toBase58()}: ${error.message}`,
            );
          }
        }
        break;
      }
      case "manual": {
        if (!Array.isArray(targetValue)) {
          throw new AirdropError(
            "Manual target requires an array of addresses",
            "INVALID_TARGET_VALUE",
          );
        }
        targetAddresses = targetValue;
        break;
      }
      case "csv": {
        if (typeof targetValue !== "string") {
          throw new AirdropError(
            "CSV target requires a file path string",
            "INVALID_TARGET_VALUE",
          );
        }

        const currentDir = process.cwd();
        const fullPath = path.join(currentDir, targetValue);

        if (!fs.existsSync(fullPath)) {
          throw new AirdropError(
            `File not found at ${fullPath}. Current directory: ${currentDir}`,
            "FILE_NOT_FOUND",
          );
        }

        try {
          const fileContent = fs.readFileSync(fullPath, "utf-8");
          targetAddresses = fileContent
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        } catch (error: any) {
          throw new AirdropError(
            `Failed to read file at ${fullPath}: ${error.message}`,
            "FILE_READ_ERROR",
          );
        }
        break;
      }
    }

    if (targetAddresses.length === 0) {
      throw new AirdropError("No valid target addresses found", "NO_TARGETS");
    }

    // Calculate costs
    const rentExemptBalance =
      await agent.connection.getMinimumBalanceForRentExemption(165);
    const ataCost = createAssociatedAccounts
      ? targetAddresses.length * rentExemptBalance
      : 0;
    const totalTokens =
      amountType === "fixed" ? amount * targetAddresses.length : amount;

    // Log cost information
    console.log(`ATA Creation Cost: ${ataCost / 1e9} SOL`);
    console.log(`Total Tokens to Send: ${totalTokens}`);
    console.log(`Number of recipients: ${targetAddresses.length}`);

    // Check sender balance
    const senderBalance = await agent.connection.getBalance(sender.publicKey);
    if (senderBalance < ataCost) {
      throw new AirdropError(
        `Insufficient SOL balance for ATA creation. Required: ${ataCost / 1e9} SOL, Found: ${senderBalance / 1e9} SOL`,
        "INSUFFICIENT_SOL_BALANCE",
      );
    }

    // Process transfers
    const results: AirdropResult[] = [];
    for (const address of targetAddresses) {
      try {
        const dropInfo = {
          sendableAmount:
            amountType === "fixed" ? amount : amount / targetAddresses.length,
          sendableTokenMint: mintAddress,
          owner: address,
        };

        const txid = await sendToken(agent, dropInfo, sender, 100_000);

        results.push({
          success: true,
          txid,
          address,
        });
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          address,
        });
      }
    }

    // Log summary
    const successful = results.filter((r) => r.success).length;
    console.log(`\nAirdrop Complete:`);
    console.log(`✓ Successful transfers: ${successful}`);
    console.log(`✗ Failed transfers: ${results.length - successful}`);

    return results;
  } catch (error: any) {
    if (error instanceof AirdropError) {
      throw error;
    }
    throw new AirdropError(
      `Airdrop failed: ${error.message}`,
      "AIRDROP_FAILED",
    );
  }
}
