/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient, Subscriber} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/SegmintCollection.abi.json";
import KingAbi from "./abi/KingOfSegmint.abi.json";
import NftAbi from "./abi/SegmintNft.abi.json";
import IndexAbi from "./abi/Index.abi.json";
import BlockListAbi from "./abi/BlockList.abi.json";
import BigNumber from 'bignumber.js';

import {
  getMainBackgroundTileColor, getMainForegroundTileColor, tryToDecodeTile
} from '@/utils/pixels'
import {BN} from "bn.js";
import { getState } from '@/utils/indexer'

let pause = 1;
const fetchFromIndexer = true;

const Contracts = {
  collection: new Address("0:2518283f592d7e8f7dac9bbb317de0af7a6a9bd985de06c317d18a11681d8c89"),
  blocklist: new Address("0:a2400e987a8039b2179eb5be74fbe692c6b253f9bc17cfa00853e635af27d9c8"),
  king: new Address("0:fa4041a7759907ede9df9387345a9804b3a0a459180830301443ea1a8c529986"),
  nftCode: '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',
}

// Empty index code.
const indexCode = 'te6ccgECHQEAA1UAAgaK2zUcAQQkiu1TIOMDIMD/4wIgwP7jAvILGQMCGwOK7UTQ10nDAfhmifhpIds80wABn4ECANcYIPkBWPhC+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwHbPPI8DgsEA3rtRNDXScMB+GYi0NMD+kAw+GmpOAD4RH9vcYIImJaAb3Jtb3Nwb3T4ZNwhxwDjAiHXDR/yvCHjAwHbPPI8GBgEAzogggujrde64wIgghAWX5bBuuMCIIIQR1ZU3LrjAhMPBQRCMPhCbuMA+EbycyGT1NHQ3vpA0fhBiMjPjits1szOyds8CxwIBgJqiCFus/LoZiBu8n/Q1PpA+kAwbBL4SfhKxwXy4GT4ACH4a/hs+kJvE9cL/5Mg+GvfMNs88gAHFAA8U2FsdCBkb2Vzbid0IGNvbnRhaW4gYW55IHZhbHVlAhjQIIs4rbNYxwWKiuIJCgEK103Q2zwKAELXTNCLL0pA1yb0BDHTCTGLL0oY1yYg10rCAZLXTZIwbeICFu1E0NdJwgGOgOMNDBcCSnDtRND0BXEhgED0Do6A34kg+Gz4a/hqgED0DvK91wv/+GJw+GMNDgECiQ4AQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAD/jD4RvLgTPhCbuMA0x/4RFhvdfhk0ds8I44mJdDTAfpAMDHIz4cgznHPC2FeIMjPkll+WwbOWcjOAcjOzc3NyXCOOvhEIG8TIW8S+ElVAm8RyM+EgMoAz4RAzgH6AvQAcc8LaV4gyPhEbxXPCx/OWcjOAcjOzc3NyfhEbxTi+wAXEhABCOMA8gARACjtRNDT/9M/MfhDWMjL/8s/zsntVAAi+ERwb3KAQG90+GT4S/hM+EoDNjD4RvLgTPhCbuMAIZPU0dDe+kDR2zww2zzyABcVFAA6+Ez4S/hK+EP4QsjL/8s/z4POWcjOAcjOzc3J7VQBMoj4SfhKxwXy6GXIz4UIzoBvz0DJgQCg+wAWACZNZXRob2QgZm9yIE5GVCBvbmx5AELtRNDT/9M/0wAx+kDU0dD6QNTR0PpA0fhs+Gv4avhj+GIACvhG8uBMAgr0pCD0oRsaABRzb2wgMC41OC4yAAAADCD4Ye0e2Q==';

// wallet to collection 1, collection nft 0.5
const MaximumFwdFeeForBigMint = 0.15; // 0.15 / 1.5;
// 1 for deploy nft, 1 create nft,
const OneNftMintingCost = 0.8; // 0.8 / 1;
// Whole block, 1 for se, 0.2 for venom.
const MaximumClaimGasPrice = 0.2; //  0.15;

const BurnNftValue = 1.1;

const standaloneFallback = () =>
  EverscaleStandaloneClient.create({
    connection: {
      id: 1,
      group: "main",
      type: "proto",
      data: {
        endpoint: "https://jrpc.venom.foundation/"
      },
    },
  });

async function loadCollection(provider, commit, getRefreshEnabled) {
  let collectionSubscriber;
  try {
    collectionSubscriber = new provider.Subscriber()
    // Subscribe at first
    const collectionContract = new provider.Contract(CollectionAbi, Contracts.collection);
    const blockListContract = new provider.Contract(BlockListAbi, Contracts.blocklist);

    let {fields: blockedListParsedState} = await blockListContract.getFields({});
    let blockedNftById = {};
    let blockListManagers = {};

    for (let item of blockedListParsedState.blocked_) {
      blockedNftById[item[0]] = true;
      commit('Provider/addBlockedNft', { id: item[0] });
    }
    for (let item of blockedListParsedState.managers_) {
      blockListManagers[item[0]] = true;
    }
    commit('Provider/setBlockListManagers', blockListManagers);

    // We collect every new taken pixels & colorify nfts
    // To be added after cached state is loaded.
    collectionSubscriber.transactions(blockListContract.address).on(async  (data) => {
      console.log('We got a new transactions on blockList address', data);
      for (let tx of data.transactions.reverse()) {
        let events = await blockListContract.decodeTransactionEvents({ transaction: tx });
        for (let event of events) {
          if (event.event === 'NftBlocked') {
            blockedNftById[event.data.id] = true;
            commit('Provider/addBlockedNft', { id: event.data.id });
          }
        }
      }
    });

    let seconds = Date.now();
    let lastCollectionTransactionLt;
    console.log('get new state');

    if (fetchFromIndexer) {
      let {state : collectionState} = await provider.getFullContractState({address: Contracts.collection})
      const indexerState = await getState(collectionContract.address.toString(), collectionState.lastTransactionId.lt);
      console.log('state got', ((Date.now() - seconds) / 1000).toFixed(1));
      lastCollectionTransactionLt = new BigNumber(indexerState.lastTransactionLt);
      commit('Provider/setEpoch', { epoch: indexerState.currentEpoch_, price: indexerState.currentEpochTilePrice_ });
      commit('Provider/setMintDisabled', indexerState.mintDisabled_);
      commit('Provider/setCollection', { collectionContract, nftTvc: await provider.codeToTvc(Contracts.nftCode) });
      let tilesByIndex = indexerState.tilesByIndex;
      for (let y = 0; y < 50; y++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        for (let x = 0; x < 50; x++) {
          let index = x * 50 + y;
          if (!tilesByIndex[index]) {
            const tile = {
              index: index,
              nftId: "4294967295",
              epoch: 0,
              x: x * 20,
              y: y * 20,
              pixels: Array(20 * 20 * 4).fill(0)
            }
            commit('Provider/setTile', {
              tile: tile,
              silent: true
            });
          } else {
            commit('Provider/setTile', {
              tile: {
                ...tilesByIndex[index],
                index: index,
                x: x * 20,
                y: y * 20,
                pixels: blockedNftById[tilesByIndex[index].nftId] ? getMainBackgroundTileColor() : tilesByIndex[index].pixels,
              },
              silent: true
            });
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1));
    } else {
      const { state: collectionCachedState } = await collectionContract.getFullState();
      console.log('collectionCachedState.lastTransactionId.hash', collectionCachedState.lastTransactionId.hash);
      console.log('state got', ((Date.now() - seconds) / 1000).toFixed(1));

      // load tiles
      let tilesColorsByIndex = {};
      let tilesByIndex = {};
      let nftCache = {};

      let { fields: parsedState } = await collectionContract.getFields({
        allowPartial: true,
        cachedState: collectionCachedState
      });
      console.log('state parsed', ((Date.now() - seconds) / 1000).toFixed(1));

      await new Promise((resolve) => setTimeout(resolve, 1));

      commit('Provider/setEpoch', { epoch: parsedState.currentEpoch_, price: parsedState.currentEpochTilePrice_ });
      commit('Provider/setMintDisabled', parsedState.mintDisabled_);
      commit('Provider/setCollection', { collectionContract, nftTvc: await provider.codeToTvc(Contracts.nftCode) });

      await new Promise((resolve) => setTimeout(resolve, 1));

      const maxNftIdBN = new BN('4294967295', 10);
      for (let elem of parsedState.tiles_) {
        let blockchainIndex = new BN(elem[0]);
        let nftIdEpochId = new BN(elem[1]);

        let x = blockchainIndex.shrn(6).toNumber();
        let y = blockchainIndex.and(new BN('63', 10)).toNumber();

        const nftId = nftIdEpochId.shrn(32).toString(10);
        const epoch = nftIdEpochId.and(maxNftIdBN).toString(10);
        const index = x * 50 + y;
        const tvc = await provider.codeToTvc(Contracts.nftCode);

        try {
          let nftParsedState;
          if (nftId in nftCache) {
            nftParsedState = nftCache[nftId];
          } else {
            const {address: nftAddress} = await provider.getStateInit(NftAbi, {
              workchain: 0,
              tvc: tvc,
              initParams: {
                _id: nftId
              }
            })
            const nftContract = new provider.Contract(NftAbi, nftAddress);
            let {state : nftFullState} = await provider.getFullContractState({address: nftAddress});
            let {fields} = await nftContract.getFields({cachedState: nftFullState});
            nftParsedState = {
              x: parseInt(fields.nftTileStartX_),
              y: parseInt(fields.nftTileStartY_),
              width: parseInt(fields.nftTileEndX_) - parseInt(fields.nftTileStartX_),
              height: parseInt(fields.nftTileEndY_) -  parseInt(fields.nftTileStartY_),
              colors: fields.colors_,
            }
            commit('Provider/setNftData', {
              id: nftId,
              description: fields.description_,
              url: fields.url_
            });

            nftCache[nftId] = nftParsedState;
            // to avoid ddos
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          tilesByIndex[index] = {
            index: index,
            nftId: nftId,
            epoch: epoch,
            x: x * 20,
            y: y * 20,
            pixels: tryToDecodeTile(nftParsedState.colors[(x - nftParsedState.x) * nftParsedState.height + y - nftParsedState.y])
          };
          commit('Provider/setTile', {
            tile: tilesByIndex[index],
            silent: true
          });
        } catch (e) {
          tilesByIndex[index] = {
            index: index,
            nftId: nftId,
            epoch: epoch,
            x: x * 20,
            y: y * 20,
            pixels: getMainBackgroundTileColor()
          };
          commit('Provider/setTile', {
            tile: tilesByIndex[index],
            silent: true
          });
          // console.log(e);
        }
        // tilesByIndex[index] = {
        //   index: index,
        //   nftId: nftId,
        //   epoch: epoch,
        //   x: x * 20,
        //   y: y * 20,
        //   pixels: blockedNftById[nftId] ? getMainBackgroundTileColor() : tryToDecodeTile(elem[1].colors)
        // };
      }
      await new Promise((resolve) => setTimeout(resolve, 1));

      for (let y = 0; y < 50; y++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        for (let x = 0; x < 50; x++) {
          let index = x * 50 + y;
          if (!tilesByIndex[index]) {
            const tile = {
              index: index,
              nftId: "4294967295",
              epoch: 0,
              x: x * 20,
              y: y * 20,
              pixels: Array(20 * 20 * 4).fill(0)
            }
            commit('Provider/setTile', {
              tile: tile,
              silent: true
            });
          }
        }
      }
      lastCollectionTransactionLt = new BigNumber(collectionCachedState.lastTransactionId.lt);
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    commit('Provider/setCollectionLoaded');

    console.log('Collection loaded', ((Date.now() - seconds)/1000).toFixed(1));
    let lastNftId = 0;
    async function processTransaction(tx) {
      let events = await collectionContract.decodeTransactionEvents({ transaction: tx });
        for (let event of events) {
          if (event.event === "TileColorify") {
            let x = parseInt(event.data.tileX);
            let y = parseInt(event.data.tileY);
            let tile = {
              index: x * 50 + y,
              nftId: event.data.nftId,
              epoch: event.data.nftEpoch,
              x: x * 20,
              y: y * 20,
              pixels: blockedNftById[event.data.nftId] ? getMainBackgroundTileColor() : tryToDecodeTile(event.data.colors),
            }
            commit('Provider/setTile', { tile: tile });
          } else if (event.event === 'NftMinted') {
            if (!lastNftId)
              lastNftId = parseInt(event.data.nftId);
            if (lastNftId !== parseInt(event.data.nftId) && lastNftId + 1 !== parseInt(event.data.nftId))
              console.log('BAD NFT', lastNftId, parseInt(event.data.nftId));
            lastNftId = parseInt(event.data.nftId);
            let x = parseInt(event.data.tileStartX);
            let y = parseInt(event.data.tileStartY);

            let endX = parseInt(event.data.tileEndX);
            let endY = parseInt(event.data.tileEndY);

            let colorsIndex = 0;
            for (let tx = x; tx < endX; tx++) {
              for (let ty = y; ty < endY; ty++) {
                let tile = {
                  index: tx * 50 + ty,
                  nftId: event.data.nftId,
                  epoch: event.data.nftEpoch,
                  x: tx * 20,
                  y: ty * 20,
                  pixels: blockedNftById[event.data.nftId] ? getMainBackgroundTileColor() : tryToDecodeTile(event.data.colors[colorsIndex])
                }
                colorsIndex++;
                commit('Provider/setTile', { tile: tile });
              }
            }
          } else if (event.event === 'MintDisabledChanged') {
            // We catch only newValue = true, because user must refresh the page
            // to start claim again
            if (event.data.newValue) {
              commit('Provider/setMintDisabled', event.data.newValue);
            }
          } else if (event.event === 'EpochChanged') {
            commit('Provider/setEpoch', { epoch: event.data.newEpoch, price: event.data.oneTileClaimPrice });
          }
        }
    }

    let startedAt = Date.now();
    let stopAfterTime = 1000 * 60 * 60;
    async function fetchTransactionsRecursive() {
      if (!getRefreshEnabled()) {
        return;
      }
      if (Date.now() > startedAt + stopAfterTime) {
        commit('Provider/setCollectionOutOfSync', {});
        return;
      }
      try {
        let transactions = await getTransactionsUpToLt(lastCollectionTransactionLt, undefined, 0);
        transactions.sort((a, b) => new BigNumber(b.id.lt).minus(new BigNumber(a.id.lt)).toNumber());
        for (let tx of transactions.reverse()) {
          if (new BigNumber(tx.id.lt).gt(lastCollectionTransactionLt)) {
            console.log('new gt!');
            lastCollectionTransactionLt = new BigNumber(tx.id.lt);
          }
          try {
            await processTransaction(tx);
          } catch (e) {
            console.log('Process transaction error', tx);
          }
        }
      } catch (e) {
        console.log('Get transactions error', e);
      }
      setTimeout(fetchTransactionsRecursive, 10000);
    }

    async function getTransactionsUpToLt(lastTransactionLt, fromContinuation, anti_stuck) {
      console.log('getTransactionsUpToLt', lastTransactionLt.toString());
      try {
        if (!fromContinuation) {
          let {state : collectionState} = await provider.getFullContractState({address: Contracts.collection})
          fromContinuation = {
            lt: collectionState.lastTransactionId.lt,
            hash: '00'.repeat(32)
          }
        }
        let {transactions, continuation} = await provider.getTransactions({
          address: collectionContract.address,
          limit: 10,
          continuation: fromContinuation
        });
        let targetFound = false;
        transactions = transactions.filter(t => {
          if (new BigNumber(t.id.lt).lte(lastTransactionLt)) {
            targetFound = true;
            return false;
          }
          return true;
        })
        if (targetFound || !continuation) {
          return transactions;
        } else if (anti_stuck < 29) {
          await new Promise(resolve => setTimeout(resolve, anti_stuck * 10));
          return transactions.concat(await getTransactionsUpToLt(lastTransactionLt, continuation, anti_stuck + 1))
        } else {
          commit('Provider/setCollectionOutOfSync', {});
          throw new Error('stuck');
        }
      } catch (e) {
        if (anti_stuck >= 29) {
          // Just return nothing
          console.log('We stuck!!!');
          commit('Provider/setCollectionOutOfSync', {});
          return new Promise(resolve => {});
        } else {
          return Promise.reject(e);
        }
      }
    }
    console.log('pre final fetch');
    await fetchTransactionsRecursive();
    console.log('after final fetch');
  } catch (e) {
    console.log('load collection error', e);
    collectionSubscriber && collectionSubscriber.unsubscribe();
    pause++;
    setTimeout(function() {
      loadCollection(provider, commit, getRefreshEnabled);
    }, pause > 100 ? 100000 : pause * 1000);
    console.log(e.message);
  }
}

async function fromStateToSetKingState (kingContract, cachedState) {
  let { state, fields } = await kingContract.getFields({cachedState});
  return {
    kingContract: kingContract,
    status: fields.status_,
    endTime: parseInt(fields.endTime_),
    currentKing: fields.king_,
    currentKingNftId: fields.kingNftId_,
    currentPot: new BigNumber(state.balance).div(1_000_000_000).toFixed(1),
    winningAmount: new BigNumber(fields.winningAmount_).div(1_000_000_000).toFixed(1),
    currentRound: parseInt(fields.roundNumber_),
    roundHoldTime: parseInt(fields.needToHoldTime_),
    lastTransactionLt: state.lastTransactionId.lt
  }
}
async function loadKing(provider, commit) {
  let kingSubscriber = new provider.Subscriber();
  try {
    const kingContract = new provider.Contract(KingAbi, Contracts.king);
    kingSubscriber.states(Contracts.king).on(async  (state) => {
      console.log('NEW KING STATE')
      let {state: fullState} = await kingContract.getFullState();
      commit('Provider/setKingState', await fromStateToSetKingState(kingContract, fullState));
    });

    // give subscriber some time to subscribe
    await new Promise(resolve => setTimeout(resolve, 1000));
    let { state: fullState } = await kingContract.getFullState();
    commit('Provider/setKingState', await fromStateToSetKingState(kingContract, fullState));
  } catch (e) {
    console.log('load king error', e);
    kingSubscriber && kingSubscriber.unsubscribe();
    setTimeout(function() {
      loadKing(provider, commit);
    }, 30_000);
  }
  // Subscribe at first

}
async function fetchAccountBalance(address, provider, commit) {
  provider.getBalance(address).then(function(balance) {
    if (balance) {
      commit('Provider/setAccountBalance', {address, balance: (balance / 1_000_000_000).toFixed(1)});
    }
  })
}

async function fetchUserNft(id, userAddress, provider, commit) {
  const {address: nftAddress} = await provider.getStateInit(NftAbi, {
    workchain: 0,
    tvc: await provider.codeToTvc(Contracts.nftCode),
    initParams: {
      _id: id
    }
  })
  const nftContract = new provider.Contract(NftAbi, nftAddress);
  let nftInfo = await nftContract.methods.getNftCustomData({answerId:0}).call({responsible: true});
  commit('setUserNft', {
    userAddress: userAddress,
    nft: {
      address: nftAddress,
      collectionAddress: Contracts.collection,
      id: nftInfo.id,
      owner: nftInfo.owner,
      lockedAmount: nftInfo.lockedAmount,
      description: nftInfo.description,
      url: nftInfo.url,
      tileStartX: parseInt(nftInfo.tileStartX),
      tileStartY: parseInt(nftInfo.tileStartY),
      tileEndX: parseInt(nftInfo.tileEndX),
      tileEndY: parseInt(nftInfo.tileEndY)
    }
  })
}

async function fetchUserNfts(userAddress, provider, collectionContract, commit) {
  console.log('Fetch users nfts');
  let nftTvc = await provider.codeToTvc(Contracts.nftCode);
  const { hash: indexCodeHash } = await provider.setCodeSalt({
    code: indexCode,
    salt: {
      structure: [
        {
          name: "type",
          type: "fixedbytes".concat("nft".length)
        },
        {
          name: "collection",
          type: "address"
        }, {
          name: "owner",
          type: "address"
        }, ],
      abiVersion: "2.1",
      data: {
        type: btoa("nft"),
        collection: Contracts.collection,
        owner: userAddress,
      }
    },
  })
  const {accounts: userNftsContracts} = await provider.getAccountsByCodeHash({codeHash: indexCodeHash});
  let nfts = [];
  for (let indexAddress of userNftsContracts) {
    try {
      let contract = new provider.Contract(IndexAbi, indexAddress);
      let {owner: ownerAddress, nft: nftAddress, collection: collectionAddress} = await contract.methods.getInfo({answerId: 0}).call({responsible: true});

      const nftContract = new provider.Contract(NftAbi, nftAddress);
      const {state: nftContractFullState} = await nftContract.getFullState();

      if (nftContractFullState && nftContractFullState.isDeployed) {
        let nftInfo = await nftContract.methods.getNftCustomData({answerId:0}).call({responsible: true, cachedState: nftContractFullState});
        if (nftInfo.owner.equals(userAddress)  && nftInfo.collection.equals(Contracts.collection)) {
          const expectedNftAddress = await provider.getExpectedAddress(NftAbi, { workchain: 0, tvc: nftTvc, initParams: { _id: nftInfo.id } });
          if (expectedNftAddress.equals(nftAddress)) {
            commit('Provider/setUserNft', {
              userAddress: userAddress,
              nft: {
                address: nftAddress,
                collectionAddress: Contracts.collection,
                id: nftInfo.id,
                owner: nftInfo.owner,
                lockedAmount: nftInfo.lockedAmount,
                description: nftInfo.description,
                url: nftInfo.url,
                tileStartX: parseInt(nftInfo.tileStartX),
                tileStartY: parseInt(nftInfo.tileStartY),
                tileEndX: parseInt(nftInfo.tileEndX),
                tileEndY: parseInt(nftInfo.tileEndY)
              }
            })
          } else {
            console.log('bad nft address', nftInfo.id);
          }
        } else {
          console.log('wrong')
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export const Provider = {
  namespaced: true,
  state: {
    venomConnect: null,
    provider: null,
    standaloneProvider: null,
    account: null,
    accountBalanceSubscriber: null,
    venomBalance: '0',
    userNftsLoadingStarted: false,
    userNfts: [],
    collectionContract: null,
    collectionPreLoaded: false,
    collectionLoaded: false,
    collectionOutOfSync: false,
    epoch: 0,
    currentTilePrice: 0,
    setTileCounter: 0, // counter to reactive update bad tiles in selections
    mintDisabled: false,
    tilesByIndex: {},
    nftCoordsById: {},
    nftDataById: {},
    blockedNftById: {},
    blockListManagers: {},
    lastNftId: 0,
    king: {
      kingContract: null,
      status: "0",
      endTime: 0,
      currentKing: null,
      currentKingNftId: null,
      currentPot: "0",
      currentRound: 1,
      winningAmount: "0",
      roundHoldTime: 300,
      lastTransactionLt: "0"
    }
  },
  mutations: {
    setVenomConnect(state, venomConnect) {
      state.venomConnect = venomConnect;
    },
    setStandaloneProvider(state, provider) {
      state.standaloneProvider = provider;
      loadCollection(provider, this.commit, this.getters['Provider/getRefreshEnabled']);
      loadKing(provider, this.commit);
    },
    setProvider(state, provider) {
      state.provider = provider;
      state.provider.subscribe('networkChanged').then((subscriber) => {
        subscriber.on('data', (event) => {
          // reinit tiles on network changed.
          const currentProviderState = provider?.getProviderState().then((currentProviderState) => {
            if (currentProviderState?.permissions?.basic && currentProviderState?.permissions?.accountInteraction) {
              // To reload balance and token balance
              this.commit('Provider/setConnectedAccount', currentProviderState?.permissions?.accountInteraction.address);
            }
          })
        });
      })
    },
    setKingState(state, {
      kingContract,
      status,
      endTime,
      currentKing,
      currentKingNftId,
      currentPot,
      winningAmount,
      currentRound,
      lastTransactionLt,
    }) {
      console.log(state.king.lastTransactionLt, lastTransactionLt)
      if (new BigNumber(state.king.lastTransactionLt).lt(new BigNumber(lastTransactionLt))) {
        state.king.kingContract = kingContract;
        state.king.status = status;
        state.king.endTime = endTime
        state.king.currentKing = currentKing.toString();
        state.king.currentKingNftId = currentKingNftId;
        state.king.currentPot = currentPot;
        state.king.winningAmount = winningAmount;
        state.king.currentRound = currentRound;
        state.king.lastTransactionLt = lastTransactionLt;
      }
      // state.king.endTime = Math.floor(Date.now()/1000) + 60 * 60 * 5;
      // state.king.currentPot = "1345.95";
      // state.king.winningAmount = "4321.95";
    },
    setCollectionOutOfSync(state) {
      state.collectionOutOfSync = true;
    },
    setCollection(state, {collectionContract, nftTvc}) {
      state.collectionContract = collectionContract;
      state.nftTvc = nftTvc
      state.collectionPreLoaded = true;
      state.account && fetchAccountBalance(state.account, state.provider, this.commit);
    },
    setCollectionLoaded(state) {
      state.collectionLoaded = true;
      if (!state.userNftsLoadingStarted && state.account) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(state.account, state.provider, state.collectionContract, this.commit);
      }
    },
    setTile(state, { tile, silent }) {
      if (parseInt(tile.nftId) > state.lastNftId && tile.nftId !== '4294967295') {
        state.lastNftId = parseInt(tile.nftId);
      }
      if (state.lastNftId - parseInt(tile.nftId) < 11) {
        let nftCoords = state.nftCoordsById[tile.nftId];
        if (!nftCoords) {
          nftCoords = {
            x: tile.x,
            y: tile.y,
            width: 20,
            height: 20
          };
          state.nftCoordsById[tile.nftId] = nftCoords;
        }
        if (tile.x < nftCoords.x) {
          nftCoords.width += nftCoords.x - tile.x;
          nftCoords.x = tile.x;
        } else if (tile.x >= nftCoords.x + nftCoords.width ) {
          nftCoords.width += tile.x + 20 - (nftCoords.x + nftCoords.width);
        }
        if (tile.y < nftCoords.y) {
          nftCoords.height += nftCoords.y - tile.y;
          nftCoords.y = tile.y;
        } else if (tile.y >= nftCoords.y + nftCoords.height ) {
          nftCoords.height += tile.y + 20 - (nftCoords.y + nftCoords.height);
        }
      }

      if (state.blockedNftById[tile.nftId] === true) {
        state.tilesByIndex[tile.index] = {
          ...tile,
          pixels: getMainBackgroundTileColor()
        }
      } else {
        state.tilesByIndex[tile.index] = tile;
      }
      if (!silent) {
        state.setTileCounter++;
        delete state.nftDataById[tile.nftId]
      }
    },
    nftMinted(state, {owner, id}) {
      if (state.account && state.account.equals(owner)) {
        fetchUserNft(id, owner, state.provider, this.commit);
      }
    },
    setConnectedAccount(state, address) {
      console.log('setConnectedAccount');
      state.account = address;
      state.venomBalance = '0';
      state.userNfts = [];

      state.accountBalanceSubscriber && clearInterval(state.accountBalanceSubscriber);
      address && fetchAccountBalance(address, state.provider, this.commit);
      address && (state.accountBalanceSubscriber = setInterval(() => {
        fetchAccountBalance(address, state.provider, this.commit)
      }, 60 * 1000));
      if (address && state.collectionContract) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(address, state.provider, state.collectionContract, this.commit);
      } else {
        state.userNftsLoadingStarted = false;
      }
    },
    setAccountBalance(state, {address, balance}) {
      if (state.account.toString() === address.toString()) {
        state.venomBalance = balance;
      }
    },
    setNftDataLoadingInProgress(state, nftId) {
      let nftDataById = state.nftDataById;
      if (!nftDataById[nftId]) {
        nftDataById[nftId] = {
          loading: true,
          url: '',
          description: ''
        }
        state.nftDataById = nftDataById;
      }
    },
    setUserNft(state, {userAddress, nft}) {
      if (state.account && state.account.equals(userAddress) && !state.userNfts.find(n => n.id === nft.id)) {
        let nfts = state.userNfts.slice();
        nfts.push(nft);
        state.userNfts = nfts;
      }
    },
    removeUserNft(state, id) {
      state.userNfts = state.userNfts.filter(nft => nft.id !== id);
    },
    setMintDisabled(state, newValue) {
      state.mintDisabled = newValue;
    },
    setEpoch(state, {epoch, price}) {
      state.currentTilePrice = price;
      state.epoch = epoch;
    },
    setNftData(state, {id, description, url}) {
      // TODO think how to make better to trigger update
      let mapping = Object.assign({}, state.nftDataById) ;
      // additional checks to prevent xss
      // not really necessary but why not
      var map = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "`": '&#x60;'
      };
      url = url.replace(/[<>"'`]/g, function(m) { return map[m]; });
      const urlPattern = /^(https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
      if (!urlPattern.test(url)) {
        url = 'https://segmint.app/'
      }
      mapping[id] = {description: description.slice(0, 2000), url: url.slice(0, 2000)};
      state.nftDataById = mapping;
    },
    makeFireShow(state, {id}) {
      console.log('makeFireShow', id);
      // DO NOT DELETE
      // We watch this event in CanvasComponent
    },
    addBlockedNft(state, {id}) {
      state.blockedNftById[id] = true;
      if (state.collectionLoaded) {
        for (let y = 0; y < 50; y++) {
          for (let x = 0; x < 50; x++) {
            let index = x * 50 + y;
            if (state.tilesByIndex[index].nftId === id) {
              const tile = {
                index: index,
                nftId: id,
                epoch: state.tilesByIndex[index].epoch,
                x: x * 20,
                y: y * 20,
                pixels: getMainBackgroundTileColor()
              }
              state.tilesByIndex[index] = tile;
            }
          }
        }
        let mapping = Object.assign({}, state.nftDataById) ;
        mapping[id] = {description: 'This nft is blocked on frontend side due to unappropriated content', url: 'https://segmint.app/'};
        state.nftDataById = mapping;
      }
    },
    setBlockListManagers(state, managers) {
      state.blockListManagers = managers;
    }
  },
  getters: {
    getNftDescriptionById: (state) => (id) => {
      let mapping = state.nftDataById;
      let nft = mapping[id];
      if (nft)
        return nft.description
      return '';
    },
    getRefreshEnabled: (state) => () => {
      return !state.mintDisabled && !state.collectionOutOfSync;
    },
  },
  actions:  {
    init({ state, commit }) {
      if (state.venomConnect)
        return;
      const venomConnect = new VenomConnect({
        theme: 'light',
        checkNetworkId: 1, //  1000 - venom testnet, 1337
        providersOptions: {
          venomwallet: {
            links: {},
            walletWaysToConnect: [
              {
                // NPM package everscale inpage provider
                package: ProviderRpcClient,
                packageOptions: {
                  fallback:
                    VenomConnect.getPromise("venomwallet", "extension") || (() => Promise.reject()),
                  forceUseFallback: true,
                },
                packageOptionsStandalone: {
                  fallback: standaloneFallback,
                  forceUseFallback: true,
                },
                // Setup
                id: "extension",
                type: "extension",
              },
            ],
            defaultWalletWaysToConnect: [
              // List of enabled options
              "mobile",
              "ios",
              "android",
            ],
          },
          oneartwallet: {
            walletWaysToConnect: [
              {
                // NPM package
                package: ProviderRpcClient,
                packageOptions: {
                  fallback:
                    VenomConnect.getPromise("oneartwallet", "extension") ||
                    (() => Promise.reject()),
                  forceUseFallback: true,
                },
                packageOptionsStandalone: {
                  fallback: standaloneFallback,
                  forceUseFallback: true,
                },
                // Setup
                id: "extension",
                type: "extension",
              },
            ],
            defaultWalletWaysToConnect: [
              // List of enabled options
              "mobile",
              "ios",
              "android",
            ],
          },
          oxychatwallet: {
            walletWaysToConnect: [
              {
                // NPM package
                package: ProviderRpcClient,
                packageOptions: {
                  fallback:
                    VenomConnect.getPromise("oxychatwallet", "extension") ||
                    (() => Promise.reject()),
                  forceUseFallback: true,
                },
                packageOptionsStandalone: {
                  fallback: standaloneFallback,
                  forceUseFallback: true,
                },

                // Setup
                id: "extension",
                type: "extension",
              },
            ],
            defaultWalletWaysToConnect: [
              // List of enabled options
              "mobile",
              "ios",
              "android",
            ],
          },
          // everwallet: {
          //   links: {},
          //   walletWaysToConnect: [
          //     {
          //       // NPM package
          //       package: ProviderRpcClient,
          //       packageOptions: {
          //         fallback:
          //           VenomConnect.getPromise("everwallet", "extension") ||
          //           (() => Promise.reject()),
          //         forceUseFallback: true,
          //       },
          //       packageOptionsStandalone: {
          //         fallback: standaloneFallback,
          //         forceUseFallback: true,
          //       },
          //       id: "extension",
          //       type: "extension",
          //     },
          //   ],
          //   defaultWalletWaysToConnect: [
          //     // List of enabled options
          //     "mobile",
          //     "ios",
          //     "android",
          //   ],
          // },
        },
      });
      commit('setVenomConnect', venomConnect);
      // Get standalone provider or  already connected wallet
      venomConnect.checkAuth().then(async (provider) => {
        await provider?.ensureInitialized();
        const currentProviderState = await provider?.getProviderState();
        window.provider = provider;
        let standAloneProvider = await venomConnect.getStandalone();
        console.log('standAloneProvider', standAloneProvider)
        commit('setStandaloneProvider', standAloneProvider);
        if (currentProviderState?.permissions?.basic && currentProviderState?.permissions?.accountInteraction) {
          console.log('We connected');
          commit('setProvider', provider);
          commit('setConnectedAccount', currentProviderState?.permissions?.accountInteraction?.address);
        }
      });

      venomConnect.on('extension-auth', async function (provider) {
        const currentProviderState = await provider?.getProviderState();
        commit('setProvider', provider);
        if (currentProviderState?.permissions?.accountInteraction?.address) {
          commit('setConnectedAccount', currentProviderState?.permissions?.accountInteraction?.address);
        }
      });
    },
    connect({state, commit}) {
      state.venomConnect.connect();
    },
    disconnect({state, commit}) {
      state.provider.disconnect();
      commit('setConnectedAccount', null);
    },
    claimTiles({state, commit}, {tileStartX, tileStartY, tileEndX, tileEndY, tiles, description, url}) {
      if (state.account === null) {
        // connect first
        state.venomConnect.connect();
        return;
      }
      if (url.toLowerCase().indexOf('http') !== 0) {
        url = 'https://' + url;
      }
      for (let x = tileStartX; x < tileEndX; x ++) {
        for (let y = tileStartY; y < tileEndY; y ++) {
          const index = x*50 + y;
          const tileInStore = state.tilesByIndex[index];
          if (tileInStore.epoch === state.epoch && tileInStore.nftId !== '4294967295') {
            return Promise.reject(new Error('This space is already occupied. Please select another tiles.'));
          }
        }
      }
      let collection = new state.provider.Contract(CollectionAbi, Contracts.collection);
      const promise = collection.methods.claimTiles({
        "tileStartX": tileStartX,
        "tileStartY": tileStartY,
        "tileEndX": tileEndX,
        "tileEndY": tileEndY,
        "tilesToColorify": tiles,
        "description": description || '',
        "url": url || '',
      }).send({
        from: state.account,
        bounce: true,
        amount: Math.floor( ((tileEndX - tileStartX) * (tileEndY - tileStartY)) * parseInt(state.currentTilePrice) + (MaximumFwdFeeForBigMint + OneNftMintingCost + MaximumClaimGasPrice) * 1_000_000_000).toString(),
      }).then(firstTx => {
        return new Promise(async (resolve, reject) => {
          try {
            let nftMinted = false;
            let txs = [];
            const subscriber = new state.standaloneProvider.Subscriber();
            console.log('Look for the first TX');
            await subscriber.trace(firstTx).filter(tx_in_tree => {
              try {
                if (tx_in_tree.account.equals(Contracts.collection)) {
                  txs.push(tx_in_tree);
                  return true;
                }
              } catch (e) {
                console.log(e);
              }
              return false;
            }).first();
            console.log('First TX found');
            for (let tx of txs) {
              let events = await state.collectionContract.decodeTransactionEvents({ transaction: tx });
              for (let event of events) {
                  if (event.event === 'NftMinted') {
                    nftMinted = true;
                    setTimeout(() => {
                      fetchUserNft(event.data.nftId, event.data.owner, state.provider, commit);
                    }, 10000);
                    let x = parseInt(event.data.tileStartX);
                    let y = parseInt(event.data.tileStartY);

                    let endX = parseInt(event.data.tileEndX);
                    let endY = parseInt(event.data.tileEndY);

                    let colorsIndex = 0;
                    for (let tx = x; tx < endX; tx++) {
                      for (let ty = y; ty < endY; ty++) {
                        let tile = {
                          index: tx * 50 + ty,
                          nftId: event.data.nftId,
                          epoch: event.data.nftEpoch,
                          x: tx * 20,
                          y: ty * 20,
                          pixels: tryToDecodeTile(event.data.colors[colorsIndex])
                        }
                        colorsIndex++;
                        commit('setTile', { tile: tile });
                      }
                    }
                  }
              }
            }
            console.log('nftMinted', nftMinted);
            if (nftMinted) {
              resolve();
            } else {
              reject(new Error('Nft not minted :-(. Price changed or space occupied.'));
            }
          } catch (e) {
            console.log(e);
            reject(e);
          }
        })
      });
      return promise;
    },
    redrawNft({state, commit}, {id, tiles, description, url}) {
      let collection = new state.provider.Contract(CollectionAbi, Contracts.collection);
      if (url.toLowerCase().indexOf('http') !== 0) {
        url = 'https://' + url;
      }
      return state.standaloneProvider.getStateInit(NftAbi, {
        workchain: 0,
        tvc: state.nftTvc,
        initParams: {
          _id: id
        }
      }).then(function(data) {
        const nftContract = new state.provider.Contract(NftAbi, data.address);
        return nftContract.methods.colorify({
          "colors": tiles,
          "description": description || '',
          "url": url || '',
        }).send({
          from: state.account,
          bounce: true,
          amount: '1000000000'
        }).then(function(firstTx) {
          return new Promise(async(resolve, reject) => {
            const subscriber = new state.standaloneProvider.Subscriber();
            await subscriber.trace(firstTx).tap(tx_in_tree => {
              // nothing
            }).finished();
            resolve();
          })
        })
      })
    },
    burnNft({state, commit}, id) {
      return state.provider.getStateInit(NftAbi, {
        workchain: 0,
        tvc: state.nftTvc,
        initParams: {
          _id: id
        }
      }).then(function(data) {
        let nftContract = new state.provider.Contract(NftAbi, data.address);
        return nftContract.getFields({}).then(function(nftFields) {
          if (nftFields.fields.isBurningBlocked_ === true) {
            return Promise.reject(new Error('NFT can\'t be burned because it is blocked for inappropriate content.'))
          }
          return nftContract.methods.burnNft({}).send({
            from: state.account,
            bounce: true,
            amount: (BurnNftValue * 1_000_000_000).toString(),
          }).then(function(firstTx) {
            commit('removeUserNft', id);
          })
        })
      })
    },
    kingFinishRound({state, commit}) {
      state.king.kingContract.methods.finishRound({}).sendExternal({
        withoutSignature: true,
      }).catch((e) => {
        console.log(e);
      })
      setTimeout(async() => {
        let { state: fullState } = await state.king.kingContract.getFullState();
        commit('setKingState', await fromStateToSetKingState(state.king.kingContract, fullState));
      }, 10000);
    },
    addToBanList({state, commit}, {id}) {
      const blockListContract = new provider.Contract(BlockListAbi, Contracts.blocklist);
      return blockListContract.methods.addToBanList({
        "collection": Contracts.collection,
        "nftId": id
      }).send({
        from: state.account,
        bounce: true,
        amount: '1000000000'
      })
    },
    fetchNftData({state, commit}, {id}) {
      console.log('fetchNftData', id);
      if (state.blockedNftById[id] === true) {
        commit('setNftData', {id, description: 'This nft is blocked on frontend side due to unappropriated content', url: 'https://segmint.app/'})
        return ;
      }
      if (!state.nftDataById[id] && state.standaloneProvider && state.collectionLoaded) {
        commit('setNftDataLoadingInProgress', id);
        state.standaloneProvider.getStateInit(NftAbi, {
          workchain: 0,
          tvc: state.nftTvc,
          initParams: {
            _id: id
          }
        }).then(function(data) {
          let nftContract = new state.standaloneProvider.Contract(NftAbi, data.address);
          console.log('address', data.address);
          return nftContract.methods.getNftCustomData({
            answerId: 0
          }).call({
            responsible: true
          })
        }).then(nftAnswer => {
          commit('setNftData', {id, description: nftAnswer.description, url: nftAnswer.url})
        })
      }
    }
  },
}
