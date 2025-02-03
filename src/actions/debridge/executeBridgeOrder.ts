import { z } from "zod";
import { Action } from "../../types/action";
import { executeBridgeOrder } from "../../tools/debridge/executeBridgeOrder";
import { SolanaAgentKit } from "../../agent";

const executeBridgeOrderAction: Action = {
  name: "EXECUTE_BRIDGE_ORDER",
  description: "Execute a cross-chain bridge transaction on Solana using the transaction data from CREATE_BRIDGE_ORDER.",
  similes: [
    "execute bridge transaction",
    "send bridge transaction",
    "submit bridge transaction",
    "process bridge transaction",
    "complete bridge transfer",
    "finalize cross-chain transfer"
  ],
  examples: [
    [
      {
        input: {
          transactionData: "0x23b872dd000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e000000000000000000000000e7351fd770a37282b91d153ee690b63579b6e837000000000000000000000000000000000000000000000000000de0b6b3a7640000"
        },
        output: {
          status: "success",
          signature: "4jJ6UvwqzHHqKif7hKvz3JwA8qQFEAuQqFBpPgX6qHzk9UF9eBiNJSqrEEtbqzVBGZYqoAKK6hUqHP4YmwmvQsZm",
          message: "Successfully executed bridge transaction. Signature: 4jJ6..."
        },
        explanation: "Execute a cross-chain bridge transaction using transaction data from CREATE_BRIDGE_ORDER."
      }
    ]
  ],
  schema: z.object({
    transactionData: z.string().describe("Transaction data obtained from CREATE_BRIDGE_ORDER command")
  }),
  handler: async (agent: SolanaAgentKit, input: Record<string, any>): Promise<Record<string, any>> => {
    try {
      process.stdout.write("\n⚠️  WARNING: About to execute cross-chain bridge transaction. This will move tokens between chains.\n");
      process.stdout.write(`\n📝 Using transaction data: ${input.transactionData}\n`);
      
      const signature = await executeBridgeOrder(agent, input.transactionData);

      return {
        status: "success",
        signature,
        message: `Successfully executed bridge transaction. Signature: ${signature.slice(0, 4)}...`
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `Failed to execute bridge transaction: ${error.message}`
      };
    }
  }
};

export default executeBridgeOrderAction;
