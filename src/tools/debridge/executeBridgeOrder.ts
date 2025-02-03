import { VersionedTransaction } from "@solana/web3.js";
import { SolanaAgentKit } from "../../agent";

/**
 * Execute a bridge transaction on Solana.
 * Takes the transaction data from createBridgeOrder and executes it.
 * Returns immediately after sending without waiting for confirmation.
 * 
 * @param agent SolanaAgentKit instance for signing and sending the transaction
 * @param transactionData Hex-encoded transaction data from createBridgeOrder
 * @returns Transaction signature
 */
export async function executeBridgeOrder(
  agent: SolanaAgentKit,
  transactionData: string
): Promise<string> {
  try {
    process.stdout.write("\n Preparing bridge transaction...");
    
    const txBuffer = Buffer.from(transactionData.substring(2), "hex");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // Get a fresh blockhash
    const { blockhash } = await agent.connection.getLatestBlockhash();
    
    // Update the blockhash in the transaction
    transaction.message.recentBlockhash = blockhash;

    // Sign the transaction
    transaction.sign([agent.wallet]);
    
    process.stdout.write("\n Sending transaction...");
    
    // Send transaction with optimal parameters
    const signature = await agent.connection.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3
    });
    
    process.stdout.write(`\n Transaction sent! View on explorer: https://explorer.solana.com/tx/${signature}`);
    
    return signature;
  } catch (error: any) {
    process.stderr.write(`\n Failed to execute bridge transaction: ${error.message}\n`);
    if (error.logs) {
      process.stderr.write("\n Transaction logs:");
      error.logs.forEach((log: string) => process.stderr.write(`\n${log}`));
    }
    throw error;
  }
}
