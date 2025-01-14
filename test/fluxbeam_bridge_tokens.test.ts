import { SolanaAgentKit } from "../src";
import { TOKENS } from "../src/constants";
import { Chain, fluxbeamBridgeTokens } from "../src/tools/fluxbeam_bridge_tokens";

const testBridgeTokens = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  const destination_wallet_address =
    "destination_wallet_address";

 const fromToken = TOKENS.SOL.toString();
 const toToken = "0x4200000000000000000000000000000000000006"; //WETH

 const signature = await fluxbeamBridgeTokens(
    agent,
    Chain.Base,
    destination_wallet_address,
    fromToken,
    toToken,
    0.020
 )
   console.log(`this is signature ${signature}`);
};

testBridgeTokens()
