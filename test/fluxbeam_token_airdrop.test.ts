import { SolanaAgentKit } from "../src";
import { TOKENS } from "../src/constants";
import {fluxbeamTokenAirdrop} from "../src/tools"
const testTokenAirdrop = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

    //  await fluxbeamTokenAirdrop(
    //    agent,
    //    agent.wallet,
    //    "",

    //    "fixed",
    //    100,
    //    "manual",
    //    [
    //      "FHmBz4SnZ5r6Rws958S8WJ5ymnrvUdwjgrVQ3BVeBH95",
    //      "3HyECVGdysActCjqyATwJLngHmXUg8kw64svzh8BeVH9",
    //      "41KHBtdibhUE1KYbXFFQF9ZTFWTKuwc2WSFjLAJArKSV",
    //    ],
    //    true,
    //  ),
    console.log(agent.wallet_address)
       await fluxbeamTokenAirdrop(
         agent,
         agent.wallet,
         "Exneu2TBk8Jo45AAFJ43PKH1ZDCVD9mbzHM1CvnFT94i",
         "fixed",
         10,
         "csv",
         "/test/addresses.csv",
         true,
         0, // minimum balance
       );
};

testTokenAirdrop()



    // // Example 2: Dynamic amount to token holders
   