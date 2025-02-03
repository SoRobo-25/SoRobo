import { Action } from "../../types/action";
import { SolanaAgentKit } from "../../agent";
import { z } from "zod";
import { checkTransactionStatus } from "../../tools/debridge";

const checkTransactionStatusAction: Action = {
  name: "CHECK_BRIDGE_TRANSACTION_STATUS",
  similes: [
    "check bridge status",
    "check debridge transaction",
    "get bridge status",
    "bridge transaction status",
  ],
  description: "Check the status of a cross-chain bridge transaction on DeBridge",
  examples: [
    [
      {
        input: {
          txHash: "5v6Jx3qHsNaQvPe1Cs3AooAiY2ZnutxQHNJrHw9SwJzAeaDXMaD2JYGE579CFk88jMFw4YiKqmLUc6QCAwvhjKQX",
        },
        output: {
          status: "success",
          orders: [
            {
              status: "completed",
              srcChainTxHash: "5v6Jx3qHsNaQvPe1Cs3AooAiY2ZnutxQHNJrHw9SwJzAeaDXMaD2JYGE579CFk88jMFw4YiKqmLUc6QCAwvhjKQX",
              dstChainTxHash: "0x1234567890abcdef",
              orderLink: "https://app.debridge.finance/order?orderId=0x9876543210",
            }
          ],
          message: "Bridge transaction status retrieved successfully",
        },
        explanation: "Check the status of a bridge transaction from Solana to another chain",
      },
    ],
  ],
  schema: z.object({
    txHash: z.string().describe("Transaction hash to check status for"),
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>) => {
    try {
      const orders = await checkTransactionStatus(agent, input.txHash);

      return {
        status: "success",
        orders,
        message: "Bridge transaction status retrieved successfully",
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
      };
    }
  },
};

export default checkTransactionStatusAction;
