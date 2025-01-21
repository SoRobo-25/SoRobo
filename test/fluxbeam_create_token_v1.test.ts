import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { fluxbeamCreateTokenV1 } from "../src/tools";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { uploadImage } from "../src/utils/FluxbeamClient";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const testCreateTokenV1 = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );
    const umi = createUmi(agent.connection.rpcEndpoint).use(mplToolbox()).use(irysUploader());;
    umi.use(keypairIdentity(fromWeb3JsKeypair(agent.wallet)));

  let uri_string = "https://gateway.irys.xyz/FUj4bG5fZFfuFC5E6GnnYGAFqcz5wYVHRmhnduc3bAqw"

  // const uri = await uploadImage(umi, 'test/pic5.jpg');

  const signature = await fluxbeamCreateTokenV1(
    agent,
    "test flower",
    "TSTFLWR",
    9,
    undefined,
    "/test/pic5.jpg",
    uri_string,
  );
  console.log(`this is signature for create mint txn ${signature}`);
};


testCreateTokenV1()

