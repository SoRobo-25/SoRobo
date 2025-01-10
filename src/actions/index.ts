import deployTokenAction from "./Metaplex/deployToken";
import balanceAction from "./Balance/balance";
import transferAction from "./AgentActions/transfer";
import deployCollectionAction from "./Metaplex/deployCollection";
import mintNFTAction from "./Metaplex/mintNFT";
import tradeAction from "./Jupiter/trade";
import requestFundsAction from "./AgentActions/requestFunds";
import resolveDomainAction from "./TLDParser/resolveDomain";
import getTokenDataAction from "./Jupiter/getTokenData";
import getTPSAction from "./TPSCalculator/getTPS";
import fetchPriceAction from "./Jupiter/fetchPrice";
import stakeWithJupAction from "./Jupiter/stakeWithJup";
import stakeWithSolayerAction from "./Solayer/stakeWithSolayer";
import registerDomainAction from "./BonfidaNameService/registerDomain";
import lendAssetAction from "./Lulo/lendAsset";
import createGibworkTaskAction from "./Gibwork/createGibworkTask";
import resolveSolDomainAction from "./BonfidaNameService/resolveSolDomain";
import pythFetchPriceAction from "./Pyth/pythFetchPrice";
import getOwnedDomainsForTLDAction from "./TLDParser/getOwnedDomainsForTLD";
import getPrimaryDomainAction from "./BonfidaNameService/getPrimaryDomain";
import getAllDomainsTLDsAction from "./TLDParser/getAllDomainsTLDs";
import getOwnedAllDomainsAction from "./TLDParser/getOwnedAllDomains";
import createImageAction from "./Image/createImage";
import getMainAllDomainsDomainAction from "./BonfidaNameService/getMainAllDomainsDomain";
import getAllRegisteredAllDomainsAction from "./BonfidaNameService/getAllRegisteredAllDomains";
import raydiumCreateCpmmAction from "./Raydium/raydiumCreateCpmm";
import raydiumCreateAmmV4Action from "./Raydium/raydiumCreateAmmV4";
import createOrcaSingleSidedWhirlpoolAction from "./Orca/createOrcaSingleSidedWhirlpool";
import launchPumpfunTokenAction from "./PumpFun/launchPumpfunToken";
import getWalletAddressAction from "./AgentActions/getWalletAddress";
import flashOpenTradeAction from "./FlashTrade/flashOpenTrade";
import flashCloseTradeAction from "./FlashTrade/flashCloseTrade";

export const ACTIONS = {
  WALLET_ADDRESS_ACTION: getWalletAddressAction,
  DEPLOY_TOKEN_ACTION: deployTokenAction,
  BALANCE_ACTION: balanceAction,
  TRANSFER_ACTION: transferAction,
  DEPLOY_COLLECTION_ACTION: deployCollectionAction,
  MINT_NFT_ACTION: mintNFTAction,
  TRADE_ACTION: tradeAction,
  REQUEST_FUNDS_ACTION: requestFundsAction,
  RESOLVE_DOMAIN_ACTION: resolveDomainAction,
  GET_TOKEN_DATA_ACTION: getTokenDataAction,
  GET_TPS_ACTION: getTPSAction,
  FETCH_PRICE_ACTION: fetchPriceAction,
  STAKE_WITH_JUP_ACTION: stakeWithJupAction,
  STAKE_WITH_SOLAYER_ACTION: stakeWithSolayerAction,
  REGISTER_DOMAIN_ACTION: registerDomainAction,
  LEND_ASSET_ACTION: lendAssetAction,
  CREATE_GIBWORK_TASK_ACTION: createGibworkTaskAction,
  RESOLVE_SOL_DOMAIN_ACTION: resolveSolDomainAction,
  PYTH_FETCH_PRICE_ACTION: pythFetchPriceAction,
  GET_OWNED_DOMAINS_FOR_TLD_ACTION: getOwnedDomainsForTLDAction,
  GET_PRIMARY_DOMAIN_ACTION: getPrimaryDomainAction,
  GET_ALL_DOMAINS_TLDS_ACTION: getAllDomainsTLDsAction,
  GET_OWNED_ALL_DOMAINS_ACTION: getOwnedAllDomainsAction,
  CREATE_IMAGE_ACTION: createImageAction,
  GET_MAIN_ALL_DOMAINS_DOMAIN_ACTION: getMainAllDomainsDomainAction,
  GET_ALL_REGISTERED_ALL_DOMAINS_ACTION: getAllRegisteredAllDomainsAction,
  RAYDIUM_CREATE_CPMM_ACTION: raydiumCreateCpmmAction,
  RAYDIUM_CREATE_AMM_V4_ACTION: raydiumCreateAmmV4Action,
  CREATE_ORCA_SINGLE_SIDED_WHIRLPOOL_ACTION:
    createOrcaSingleSidedWhirlpoolAction,
  LAUNCH_PUMPFUN_TOKEN_ACTION: launchPumpfunTokenAction,
  FLASH_OPEN_TRADE_ACTION: flashOpenTradeAction,
  FLASH_CLOSE_TRADE_ACTION: flashCloseTradeAction,
};

export type { Action, ActionExample, Handler } from "../types/action";
