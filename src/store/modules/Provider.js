/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient, Subscriber} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/SegmintCollection.abi.json";
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

const Pages = {
  ocean: {
    collection: new Address("0:1a98a60471cb91af9f7c47063c2d2a5c4df325b28d53f3b3b2d05bcc5e6b81b8"),
    blocklist: new Address("0:84ce0db6019a06bf3cc8b1ac7a626993981bca23d7c6e97843735dd383093a28"),
    nftCode: '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',
  },
  desert: {
    collection: new Address("0:7f640c417b44e1a0bd870b502a47292572b78a33dfccc6c63c67c171d6505aaa"),
    blocklist: new Address("0:28fa45ac10075d1296813589b45bfa48e33ab0faaef0ea9f743170b299b293f4"),
    nftCode: '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' ,
  },
  forest: {
    collection: new Address("0:e607b54636f6d26b92f52f4c8ad2e013eee4415ef151f0881e275abf79aaebd7"),
    blocklist: new Address("0:9d3d68646544dd2344ff4e18220f5cd466ec8cb2c8380e31c0676978c97dd8df"),
    nftCode: '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'
  }
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
      id: 1000,
      group: "main",
      type: "proto",
      data: {
        endpoint: "https://jrpc-testnet.venom.foundation/"
      },
    },
  });

async function loadCollection(provider, page, commit, getRefreshEnabled) {
  let collectionSubscriber;
  try {
    collectionSubscriber = new provider.Subscriber()
    // Subscribe at first
    const collectionContract = new provider.Contract(CollectionAbi, Pages[page].collection);
    const blockListContract = new provider.Contract(BlockListAbi, Pages[page].blocklist);

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
      let {state : walletState} = await provider.getFullContractState({address: new Address('0:71ede2632f8eebb649cdd6eb19c637a3bfd165b7a01050eb172dcf83d9bbdc58')})
      const indexerState = await getState(collectionContract.address.toString(), walletState.lastTransactionId.lt);
      console.log('state got', ((Date.now() - seconds) / 1000).toFixed(1));
      lastCollectionTransactionLt = new BigNumber(indexerState.lastTransactionLt);
      commit('Provider/setEpoch', { epoch: indexerState.currentEpoch_, price: indexerState.currentEpochTilePrice_ });
      commit('Provider/setMintDisabled', indexerState.mintDisabled_);
      commit('Provider/setCollection', { collectionContract, nftTvc: await provider.codeToTvc(Pages[page].nftCode) });

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

      let { fields: parsedState } = await collectionContract.getFields({
        allowPartial: true,
        cachedState: collectionCachedState
      });
      console.log('state parsed', ((Date.now() - seconds) / 1000).toFixed(1));

      await new Promise((resolve) => setTimeout(resolve, 1));

      commit('Provider/setEpoch', { epoch: parsedState.currentEpoch_, price: parsedState.currentEpochTilePrice_ });
      commit('Provider/setMintDisabled', parsedState.mintDisabled_);
      commit('Provider/setCollection', { collectionContract, nftTvc: await provider.codeToTvc(Pages[page].nftCode) });

      await new Promise((resolve) => setTimeout(resolve, 1));

      const maxNftIdBN = new BN('4294967295', 10);
      for (let elem of parsedState.tiles_) {
        let blockchainIndex = new BN(elem[0]);
        let nftIdEpochId = new BN(elem[1].epochWitNftId);

        let x = blockchainIndex.shrn(6).toNumber();
        let y = blockchainIndex.and(new BN('63', 10)).toNumber();

        let nftId = nftIdEpochId.shrn(32).toString(10);
        let epoch = nftIdEpochId.and(maxNftIdBN).toString(10);

        const index = x * 50 + y;
        tilesByIndex[index] = {
          index: index,
          nftId: nftId,
          epoch: epoch,
          x: x * 20,
          y: y * 20,
          pixels: blockedNftById[nftId] ? getMainBackgroundTileColor() : tryToDecodeTile(elem[1].colors)
        };
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
          } else {
            commit('Provider/setTile', {
              tile: tilesByIndex[index],
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
          let {state : walletState} = await provider.getFullContractState({address: new Address('0:71ede2632f8eebb649cdd6eb19c637a3bfd165b7a01050eb172dcf83d9bbdc58')})
          fromContinuation = {
            lt: walletState.lastTransactionId.lt,
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
      loadCollection(provider, page, commit, getRefreshEnabled);
    }, pause > 100 ? 100000 : pause * 1000);
    console.log(e.message);
  }
}

async function fetchAccountBalance(address, provider, commit) {
  provider.getBalance(address).then(function(balance) {
    if (balance) {
      commit('Provider/setAccountBalance', {address, balance: (balance / 1_000_000_000).toFixed(1)});
    }
  })
}

async function fetchUserNft(id, page, userAddress, provider, commit) {
  const {address: nftAddress} = await provider.getStateInit(NftAbi, {
    workchain: 0,
    tvc: await provider.codeToTvc(Pages[page].nftCode),
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
      collectionName: page,
      collectionAddress: Pages[page].collection,
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
  for (let page of Object.keys(Pages)) {
    let nftTvc = await provider.codeToTvc(Pages[page].nftCode);
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
          collection: Pages[page].collection,
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
          if (nftInfo.owner.equals(userAddress)  && nftInfo.collection.equals(Pages[page].collection)) {
            const expectedNftAddress = await provider.getExpectedAddress(NftAbi, { workchain: 0, tvc: nftTvc, initParams: { _id: nftInfo.id } });
            if (expectedNftAddress.equals(nftAddress)) {
              commit('Provider/setUserNft', {
                userAddress: userAddress,
                nft: {
                  address: nftAddress,
                  collectionName: page,
                  collectionAddress: Pages[page].collection,
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

}

export const Provider = {
  namespaced: true,
  state: {
    page: null,
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
    nftDataById: {},
    blockedNftById: {},
    blockListManagers: {},
  },
  mutations: {
    setPage(state, page) {
      state.page = page;
    },
    setVenomConnect(state, venomConnect) {
      state.venomConnect = venomConnect;
    },
    setStandaloneProvider(state, provider) {
      state.standaloneProvider = provider;
      loadCollection(provider, state.page, this.commit, this.getters['Provider/getRefreshEnabled']);
    },
    setProvider(state, provider) {
      console.log('setProvider', provider);
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
    setCollectionOutOfSync(state) {
      console.log('setCollectionOutOfSync')
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
      }
      delete state.nftDataById[tile.nftId]
    },
    nftMinted(state, {owner, id}) {
      if (state.account && state.account.equals(owner)) {
        fetchUserNft(id, state.page, owner, state.provider, this.commit);
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
      // TODO validate url
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
    changePage({state}, {newPage}) {
      localStorage.setItem('page', newPage);
      window.location.href = `https://${newPage}.segmint.app/`;
    },
    init({ state, commit }, {page}) {
      if (state.venomConnect)
        return;
      commit('setPage', page);
      const venomConnect = new VenomConnect({
        theme: 'light',
        checkNetworkId: 1000, //  1000 - venom testnet, 1337
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
        url = 'http://' + url;
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
      let collection = new state.provider.Contract(CollectionAbi, Pages[state.page].collection);
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
                if (tx_in_tree.account.equals(Pages[state.page].collection)) {
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
                      fetchUserNft(event.data.nftId, state.page, event.data.owner, state.provider, commit);
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
      let collection = new state.provider.Contract(CollectionAbi, Pages[state.page].collection);
      if (url.toLowerCase().indexOf('http') !== 0) {
        url = 'http://' + url;
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
    addToBanList({state, commit}, {id}) {
      const blockListContract = new provider.Contract(BlockListAbi, Pages[state.page].blocklist);
      return blockListContract.methods.addToBanList({
        "collection": Pages[state.page].collection,
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
