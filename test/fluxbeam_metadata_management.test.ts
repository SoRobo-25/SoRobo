import { PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../src";
import { fluxbeamCreateTokenV1, fluxbeamUpdateV1Metadata, fluxbeamUpdateV2Metadata } from "../src/tools";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { uploadImage } from "../src/utils/FluxbeamClient";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const testUpdateMetadataTokenV1 = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );
    const umi = createUmi(agent.connection.rpcEndpoint).use(mplToolbox()).use(irysUploader());;
    umi.use(keypairIdentity(fromWeb3JsKeypair(agent.wallet)));

 
  let uri_string =
    "https://gateway.irys.xyz/FUj4bG5fZFfuFC5E6GnnYGAFqcz5wYVHRmhnduc3bAqw";

  let mint = new PublicKey("9PYyTGrSg3JaJdwouRCMvp2zzHuF1E1ieAU8iBXmdQAX");
  const signature = await fluxbeamUpdateV1Metadata(
    agent,
    mint,
    "FLWRV1",
    "FLWR",
    uri_string,
  );
  console.log(`this is signature for update mint v1 mint txn ${signature}`);
};


const testUpdateMetadataTokenV2 = async () => {
  const agent = new SolanaAgentKit(
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    },
  );

  let uri_string = "https://gateway.irys.xyz/FUj4bG5fZFfuFC5E6GnnYGAFqcz5wYVHRmhnduc3bAqw"

  let mint = new PublicKey("Exneu2TBk8Jo45AAFJ43PKH1ZDCVD9mbzHM1CvnFT94i");

  const signature = await fluxbeamUpdateV2Metadata(
    agent,
    mint,
    100_0000,
    "UPDATEDFLOWERV2",
    "UFLWR",
    uri_string
  );
  console.log(`this is signature for updatw mint v2 mint txn ${signature}`);
};


// testUpdateMetadataTokenV1()
testUpdateMetadataTokenV2()