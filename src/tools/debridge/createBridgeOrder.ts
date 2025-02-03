import { DEBRIDGE_API } from "../../constants";
import { BridgeOrderInput, BridgeOrderResponse } from "../../types";

const REFERRAL_CODE = "21064"; // Using the default from original implementation

/**
 * Create a bridge order to transfer tokens between chains.
 * 
 * Special considerations for different chains:
 * 
 * EVM to EVM:
 * - Set dstChainTokenOutRecipient to recipient's EVM address
 * - Set dstChainTokenOut to the erc-20 format address
 * 
 * To Solana (7565164):
 * - dstChainTokenOutRecipient should be Solana address (base58)
 * - dstChainTokenOut should be Solana token mint address (base58)
 * 
 * From Solana:
 * - dstChainTokenOutRecipient should be EVM address
 * - dstChainTokenOut should be ERC-20 format address
 * 
 * @param params Required parameters for creating a bridge order
 * @param params.srcChainId Source chain ID (e.g., "1" for Ethereum)
 * @param params.srcChainTokenIn Source token address (use "0x0000000000000000000000000000000000000000" for native tokens on EVM)
 * @param params.srcChainTokenInAmount Amount of source tokens to bridge (in smallest units)
 * @param params.dstChainId Destination chain ID (e.g., "7565164" for Solana)
 * @param params.dstChainTokenOut Destination token address
 * @param params.dstChainTokenOutRecipient Recipient address on destination chain
 * @param params.account Sender's wallet address
 * @returns Bridge order details and transaction data
 */
export async function createBridgeOrder(
  params: BridgeOrderInput
): Promise<BridgeOrderResponse> {
  try {
    process.stdout.write("\n🔍 Creating bridge order with parameters:");
    process.stdout.write(`\n  Source Chain ID: ${params.srcChainId}`);
    process.stdout.write(`\n  Source Token: ${params.srcChainTokenIn}`);
    process.stdout.write(`\n  Amount: ${params.srcChainTokenInAmount}`);
    process.stdout.write(`\n  Destination Chain ID: ${params.dstChainId}`);
    process.stdout.write(`\n  Destination Token: ${params.dstChainTokenOut}`);
    process.stdout.write(`\n  Destination Recipient: ${params.dstChainTokenOutRecipient}`);
    process.stdout.write(`\n  Sender's Wallet Address: ${params.account}\n`);

    if (params.srcChainId === params.dstChainId) {
      throw new Error("Source and destination chains must be different");
    }

    const queryParams = new URLSearchParams({
      srcChainId: params.srcChainId,
      srcChainTokenIn: params.srcChainTokenIn,
      srcChainTokenInAmount: params.srcChainTokenInAmount,
      dstChainId: params.dstChainId,
      dstChainTokenOut: params.dstChainTokenOut,
      dstChainTokenOutRecipient: params.dstChainTokenOutRecipient,
      senderAddress: params.account,
      srcChainOrderAuthorityAddress: params.account, // Always use sender's address
      srcChainRefundAddress: params.account, // Always use sender's address
      dstChainOrderAuthorityAddress: params.dstChainTokenOutRecipient, // Always use recipient's address
      referralCode: params.referralCode?.toString() || REFERRAL_CODE,
      prependOperatingExpenses: "true", // Always true
      // deBridgeApp: "SOLANA_AGENT_KIT",
    });
    
    process.stdout.write(`\n🌐 Requesting order from: ${DEBRIDGE_API}/dln/order/create-tx?${queryParams}\n`);

    const response = await fetch(
      `${DEBRIDGE_API}/dln/order/create-tx?${queryParams}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      process.stderr.write(`\n❌ API Error (${response.status}): ${errorText}\n`);
      throw new Error(`Failed to create bridge order: ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      process.stderr.write(`\n❌ DeBridge Error: ${data.error}\n`);
      throw new Error(`DeBridge API Error: ${data.error}`);
    }

    // Format the txData to ensure it's properly stringified
    if (data.tx?.data) {
      data.tx.data = data.tx.data.toString();
    }

    process.stdout.write("\n✅ Bridge order created successfully");
    process.stdout.write(`\n📝 Transaction Data: ${data.tx.data}`);
    process.stdout.write(`\n💰 Estimated Fee: ${data.estimation?.protocolFee} native tokens\n`);
    process.stdout.write(`\nTo execute this transaction, run:\nEXECUTE_BRIDGE_ORDER { "transactionData": "${data.tx.data}" }\n`);

    return data;
  } catch (error: any) {
    process.stderr.write(`\n❌ Failed to create bridge order: ${error.message}\n`);
    throw error;
  }
}
