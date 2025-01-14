
import { PublicKey } from "@solana/web3.js";
 import { createSolanaTools, SolanaAgentKit } from "../src";

 import { fluxbeamWrapSOL, fluxbeamUnwrapSOL} from "../src/tools";

 const testWrapandUnwrapSol = async () => {
   const solanaAgent = new SolanaAgentKit(
     process.env.SOLANA_PRIVATE_KEY!,
     process.env.RPC_URL!,
     {
       OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
     },
   );

   const signature1 = await fluxbeamWrapSOL(
     solanaAgent,
     0.00012
   );

   const signature2 = await fluxbeamUnwrapSOL(
     solanaAgent,
   );

   console.log(`this is signature one ${signature1}`);
   
   console.log(`this is signature two ${signature2}`);
 };

 testWrapandUnwrapSol();

