
import { PublicKey } from "@solana/web3.js";
 import { createSolanaTools, SolanaAgentKit } from "../src";

 import { fluxbeamWrapSOL, fluxbeamUnwrapSOL, fluxbeamTransferSplToken, fluxbeamTransferSol} from "../src/tools";
import { TOKENS } from "../src/constants";

 const testWrapandUnwrapSol = async () => {
   const agent = new SolanaAgentKit(
     process.env.SOLANA_PRIVATE_KEY!,
     process.env.RPC_URL!,
     {
       OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
     },
   );

   let v2_mint = new PublicKey("HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"); //ai16z, token 2022 token 

   let mint = TOKENS.BONK

   let dstOwner = new PublicKey("6hgnytxT3MuDL5TfjtLrd456LbXLHWnn1MmA65j7QLSE");

 const signature1 = await fluxbeamTransferSplToken(
    agent,
    v2_mint,
    dstOwner,
    0.02,
  )

  const signature2 = await fluxbeamTransferSol(
    agent,
    dstOwner,
    0.001
  )

   console.log(`this is signature one ${signature1}`);
   
  //  console.log(`this is signature two ${signature2}`);
 };

 testWrapandUnwrapSol();

