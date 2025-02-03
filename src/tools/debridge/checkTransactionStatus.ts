import { SolanaAgentKit } from "../../agent";
import { DEBRIDGE_API } from "../../constants";

/**
 * Response type for order IDs lookup
 */
interface OrderIdsResponse {
  orderIds: string[];
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Response type for order status
 */
interface OrderStatusResponse {
  status: string;
  srcChainTxHash: string;
  dstChainTxHash?: string;
  orderLink: string;
  error?: string;
}

/**
 * Check the status of bridge transactions using their transaction hash
 * This method retrieves the current status of one or more bridge transactions
 *
 * @param agent SolanaAgentKit instance
 * @param txHash Transaction hash to check status for
 * @returns Status information for the bridge transaction
 * @throws {Error} If the API request fails or returns an error
 * 
 * @example
 * ```typescript
 * const status = await checkTransactionStatus(agent, "5v6Jx3qHsNaQvPe1Cs3AooAiY2ZnutxQHNJrHw9SwJzAeaDXMaD2JYGE579CFk88jMFw4YiKqmLUc6QCAwvhjKQX");
 * ```
 */
export async function checkTransactionStatus(
  agent: SolanaAgentKit,
  txHash: string
): Promise<OrderStatusResponse[]> {
  try {
    // First get the order IDs for the transaction
    const orderIdsUrl = `${DEBRIDGE_API}/dln/tx/${txHash}/order-ids`;
    process.stdout.write(`\n🔍 Checking transaction: ${txHash}`);

    const orderIdsResponse = await fetch(orderIdsUrl);
    const responseData = await orderIdsResponse.json();

    if (!orderIdsResponse.ok) {
      // Handle specific API error responses
      if (responseData.errorCode === 2) {
        process.stderr.write(`\n❌ Invalid transaction hash format. Please provide a valid Solana transaction signature.`);
        throw new Error("Invalid transaction hash format");
      } else {
        process.stderr.write(`\n❌ API Error: ${responseData.errorMessage || 'Unknown error'}`);
        throw new Error(responseData.errorMessage || 'Unknown error');
      }
    }

    const orderIdsData = responseData as OrderIdsResponse;
    if (!orderIdsData.orderIds || orderIdsData.orderIds.length === 0) {
      process.stdout.write(`\n⚠️ No bridge orders found for this transaction. This might be because:`);
      process.stdout.write(`\n   - The transaction is too recent and hasn't been processed yet`);
      process.stdout.write(`\n   - This transaction is not a deBridge transaction`);
      process.stdout.write(`\n   - The transaction failed`);
      throw new Error("No bridge orders found for this transaction");
    }

    process.stdout.write(`\n✅ Found ${orderIdsData.orderIds.length} bridge order${orderIdsData.orderIds.length > 1 ? 's' : ''}`);

    // Then get the status for each order
    const statuses = await Promise.all(
      orderIdsData.orderIds.map(async (orderId) => {
        const statusUrl = `${DEBRIDGE_API}/dln/order/${orderId}/status`;
        process.stdout.write(`\n\n📋 Order ${orderId}:`);

        const statusResponse = await fetch(statusUrl);
        if (!statusResponse.ok) {
          const text = await statusResponse.text();
          process.stderr.write(`\n   ❌ Failed to get status: ${text}`);
          throw new Error(`Failed to get status for order ${orderId}: ${text}`);
        }

        const statusData = (await statusResponse.json()) as OrderStatusResponse;
        // Add the deBridge app link
        statusData.orderLink = `https://app.debridge.finance/order?orderId=${orderId}`;

        // Log status info with emojis based on status
        const statusEmoji = {
          'completed': '✅',
          'pending': '⏳',
          'failed': '❌',
          'processing': '🔄'
        }[statusData.status.toLowerCase()] || '❓';

        process.stdout.write(`\n   Status: ${statusEmoji} ${statusData.status}`);
        process.stdout.write(`\n   Source Chain Tx: 🔗 ${statusData.srcChainTxHash}`);
        if (statusData.dstChainTxHash) {
          process.stdout.write(`\n   Destination Chain Tx: 🔗 ${statusData.dstChainTxHash}`);
        }
        if (statusData.error) {
          process.stdout.write(`\n   Error: ❌ ${statusData.error}`);
        }
        process.stdout.write(`\n   View on deBridge: 🌐 ${statusData.orderLink}`);

        return statusData;
      })
    );

    return statuses;
  } catch (error: any) {
    // Let the error message propagate up for proper handling in the action
    throw error;
  }
}
