import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { TOKENS } from "../src/constants";
import { fluxbeamGetClaimWitheldTokens, fluxbeamGetClaimWitheldTokensFromMint, fluxbeamGetClaimWithheldTokensToMint, fluxbeamTokenAirdrop } from "../src/tools";


const testWithheldsAmountTracking = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

 let mint = new PublicKey("Exneu2TBk8Jo45AAFJ43PKH1ZDCVD9mbzHM1CvnFT94i");
  console.log(agent.wallet_address);

//   await fluxbeamGetClaimWitheldTokensFromMint(
//     agent,
//     mint,
//     agent.wallet_address
//   );

//   await fluxbeamGetClaimWithheldTokensToMint(
//     agent,
//     mint,
//     [new PublicKey("6hgnytxT3MuDL5TfjtLrd456LbXLHWnn1MmA65j7QLSE"),
// new PublicKey("4BgGjf2tNzLJ6zG6BPFYcy3F9ArzoyYm8URf96dEsh1L")],
//   )
  await fluxbeamGetClaimWitheldTokens(
    agent,
    mint,
    agent.wallet_address,
    [
      new PublicKey("6hgnytxT3MuDL5TfjtLrd456LbXLHWnn1MmA65j7QLSE"),
      new PublicKey("4BgGjf2tNzLJ6zG6BPFYcy3F9ArzoyYm8URf96dEsh1L"),
    ],
    agent.wallet_address,
  );
};

testWithheldsAmountTracking();

// // Example 2: Dynamic amount to token holders
