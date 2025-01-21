import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { TOKENS } from "../src/constants";
import {fluxbeamSubmitFeeClaim, fluxbeamTokenAirdrop} from "../src/tools"


const testSubmitFeeClaim =  async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  let mint = new PublicKey("Exneu2TBk8Jo45AAFJ43PKH1ZDCVD9mbzHM1CvnFT94i");
  const signature = await fluxbeamSubmitFeeClaim(
      agent,
      agent.wallet_address,
      mint,
      100_000
    );
console.log(`this is the signature for submit fee claim ${signature}`);
};

testSubmitFeeClaim()


