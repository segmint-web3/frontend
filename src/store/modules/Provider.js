/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/SegmintCollection.abi.json";
import NftAbi from "./abi/SegmintNft.abi.json";
import IndexAbi from "./abi/Index.abi.json";
import TokenRootAbi from "./abi/TokenRootUpgradeable.abi.json";
import TokenWalletAbi from "./abi/TokenWalletUpgradeable.abi.json";
import ProxyOwnerAbi from "./abi/ProxyOwner.abi.json";

import {covertTileColorToPixels} from "@/utils/pixels";
import {BN} from "bn.js";
import Vue from "vue";

const CollectionAddress = new Address("0:39e56510acc6bcdb694293fee3335da1fbbfae6fe661e6485bf2ece610341f5e");
const TokenRootAddress = new Address("0:431f19f8b5c48fba2368e995bd18772e20055900ae1872093fd4c7d563db1919");
const ProxyOwnerAddress = new Address("0:589f7dacb9906334a950ae15cc10bc7d55bf43fbb646c63ffd3a7a591e764bc1");

const TokenRootDecimals = 9;
const ColorifyOneTilePrice = 0.04;
// wallet -> token 0.9, waltet -> wallet 0.5, wallet -> collection 0.5, collection -> nft(colorify) 0.5;
const MaximumFwdFeeForBigMint = 0.9 + 0.5 + 0.5 + 0.5 + 0.5;
// 1 for deploy nft + indexes, 0.2 for fwd fee + 1 coin reserved on collection contract
const OneNftMintingCost = 2.2;
// whole block, 1 for se, 0.2 for venom.
const MaximumClaimGasPrice = 1;

const standaloneFallback = () =>
  EverscaleStandaloneClient.create({
    connection: {
      id: 1002,
      group: "venom_devnet",
      type: "graphql",
      data: {
        endpoints: ["https://gql-devnet.venom.network/graphql"],
        latencyDetectionInterval: 1000,
        local: false,
      },
    },
  });

async function providerChanged(provider, providerId, commit) {
  console.log('get new state');
  const collectionContract = new provider.Contract(CollectionAbi, CollectionAddress);
  const {state: collectionCachedState} = await collectionContract.getFullState();

  console.log('state got');
  const collectionSubscriber = new provider.Subscriber();
  // ug
  let waitToColorify = [];
  collectionSubscriber.transactions(collectionContract.address).on(async (data) => {
    console.log('We got a new transaction on collection address', data);
    commit('Provider/setCollection', {providerId, collectionContract, collectionCachedState, collectionSubscriber});
    commit('Provider/setUserNftIsNotLoaded');
    // TODO parse events
    for (let tx of data.transactions) {
      let events = await collectionContract.decodeTransactionEvents({transaction: tx});
      for (let event of events) {
        if (event.event === "TileColorify") {
          let x = parseInt(event.data.pixelStartX);
          let y = parseInt(event.data.pixelStartY);

          let tile = {
            index: (x / 10) * 100 + y/10,
            nftId: event.data.nftId,
            x: x,
            y: y,
            pixels: covertTileColorToPixels(event.data.tileColors)
          }
          commit('Provider/setTile', {tile: tile, providerId: providerId});
          if (waitToColorify.indexOf(event.data.nftId) !== -1) {
            waitToColorify.splice(waitToColorify.indexOf(event.data.nftId), 1);
            commit('Provider/setUserNftIsNotLoaded');
          }
        } else if (event.event === 'NftMinted') {
          waitToColorify.push(event.data.nftId)
        }
      }
    }
  });

  commit('Provider/setCollection', {providerId, collectionContract, collectionCachedState, collectionSubscriber});
}

async function loadTiles(commit, collectionContract, cachedState, providerId) {
  let tiles = [];
  let tilesByIndex = {};
  let {value0: tilesBlockchain} = await collectionContract.methods.getTiles({answerId: 0}).call({responsible: true, cachedState: cachedState});

  for (let elem of tilesBlockchain) {
    let blockchainIndex = new BN(elem[0]);
    let coloredTile = elem[1];
    let x = parseInt(blockchainIndex.shrn(7).toString(10));
    let y = parseInt(blockchainIndex.and(new BN('127', 10)).toString(10));

    const index = x * 100 + y;
    let tile = {
      index: index,
      nftId: coloredTile.nftId,
      x: x * 10,
      y: y * 10,
      pixels: covertTileColorToPixels(coloredTile.colors)
    }
    tiles.push(tile);
    tilesByIndex[index] = tile;
  }

  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      let index = x * 100 + y;
      if (!tilesByIndex[index]) {
        const tile = {
          index: index,
          nftId: "4294967295",
          x: x * 10,
          y: y * 10,
          pixels: Array(10 * 10 * 4).fill(0)
        }
        tiles.push(tile);
        tilesByIndex[index] = tile;
      }
    }
  }

  commit('Provider/setTiles', {providerId, tiles, tilesByIndex});
}

async function fetchAccountBalance(address, provider, commit) {
  console.log('fetchAccountBalance')
  provider.getBalance(address).then(function(balance) {
    if (balance) {
      commit('Provider/setAccountBalance', {address, balance: (balance / 1_000_000_000).toFixed(1)});
    }
  })
}

async function fetchUserNfts(userAddress, provider, collectionContract, collectionCachedState, commit) {
  console.log('Fetch users nfts!!!!!!');
  const {codeHash: indexCodeHash} = await collectionContract.methods.getNftIndexCodeHash({answerId: 0, _owner: userAddress}).call({responsible: true, cachedState: collectionCachedState})
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
        if (nftInfo.owner.equals(userAddress)  && nftInfo.collection.equals(collectionContract.address)) {
          const {nft: expectedNftAddress} = await collectionContract.methods.nftAddress({answerId: 0, id: nftInfo.id}).call({responsible: true, cachedState: collectionCachedState})
          if (expectedNftAddress.equals(nftAddress)) {
            nfts.push({
              address: nftAddress,
              id: nftInfo.id,
              owner: nftInfo.owner,
              description: nftInfo.description,
              url: nftInfo.url,
              x: parseInt(nftInfo.tilePixelsStartX),
              y: parseInt(nftInfo.tilePixelsStartY),
              width: parseInt(nftInfo.tilePixelsEndX) - parseInt(nftInfo.tilePixelsStartX),
              height: parseInt(nftInfo.tilePixelsEndY) - parseInt(nftInfo.tilePixelsStartY)
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
      // nothing
    }
  }
  commit('Provider/setUserNfts', {address: userAddress, nfts: nfts});
}

async function fetchUserTokenWalletBalance(address, provider, commit) {
  const tokenRootContract = new provider.Contract(TokenRootAbi, TokenRootAddress);
  const {value0: walletAddress} = await tokenRootContract.methods.walletOf({answerId: 0, walletOwner: address}).call({responsible: true});

  const tokenWalletContract = new provider.Contract(TokenWalletAbi, walletAddress);

  const {state} = await tokenWalletContract.getFullState();
  let balance = 0;
  if (state && state.isDeployed) {
    const {value0: walletBalance} = await tokenWalletContract.methods.balance({answerId: 0}).call({responsible: true});
    console.log('wallet balance', walletBalance);
    balance = parseInt(walletBalance);
  } else {
    console.log('wallet is not deployed');
  }

  const subscriber = new provider.Subscriber();
  subscriber.transactions(tokenWalletContract.address).on(async (data) => {
    // we got a new transaction
    console.log('wallet new transaction')
    const {value0: walletBalance} = await tokenWalletContract.methods.balance({answerId: 0}).call({responsible: true});
    commit('Provider/setTokenWallet', {address, tokenWalletContract, balance: parseInt(walletBalance), subscriber});
  })
  commit('Provider/setTokenWallet', {address, tokenWalletContract, balance, subscriber});
}

export const Provider = {
  namespaced: true,
  state: {
    venomConnect: null,
    provider: null,
    account: null,
    venomBalance: '0',
    userNftsLoadingStarted: false,
    userNfts: [],
    // subscriber for new events
    providerId: 0, // For concurrency control, in case provider changed.
    collectionContract: null,
    collectionCachedState: null,
    collectionSubscriber: null,
    collectionLoaded: false,
    tokenWalletContract: null,
    tokenWalletSubscriber: null,
    tokenWalletBalance: 0,
    tiles: [],
    tilesByIndex: {},
    nftDataById: {}
  },
  mutations: {
    setVenomConnect(state, venomConnect) {
      state.venomConnect = venomConnect;
    },
    setProvider(state, provider) {
      console.log('setProvider', provider);
      // We have new instance of provider
      // Reset everything
      state.providerId += 1;
      state.collectionContract = null;
      state.collectionCachedState = null;
      // state.collectionLoaded = false;
      // state.tiles = [];

      // unsubscribe previous provider
      state.collectionSubscriber && state.collectionSubscriber.unsubscribe();
      state.collectionSubscriber = null;

      state.tokenWalletContract = null;
      state.tokenWalletBalance = 0;
      state.tokenWalletSubscriber && state.tokenWalletSubscriber.unsubscribe();
      state.tokenWalletSubscriber = null;

      state.provider = provider;
      state.provider.subscribe('networkChanged').then((subscriber) => {
        subscriber.on('data', (event) => {
          // reinit tiles on network changed.
          providerChanged(provider, state.providerId, this.commit);
          const currentProviderState = provider?.getProviderState().then((currentProviderState) => {
            if (currentProviderState?.permissions?.basic && currentProviderState?.permissions?.accountInteraction) {
              // To reload balance and token balance
              this.commit('Provider/setConnectedAccount', currentProviderState?.permissions?.accountInteraction.address);
            }
          })
        });
      })
      providerChanged(provider, state.providerId, this.commit);
    },
    setCollection(state, {providerId, collectionContract, collectionCachedState, collectionSubscriber}) {
      console.log('setCollection')
      if (state.providerId !== providerId) {
        collectionSubscriber.unsubscribe();
        return;
      }
      state.collectionContract = collectionContract;
      state.collectionCachedState = collectionCachedState;
      state.collectionSubscriber = collectionSubscriber;
      if (!state.userNftsLoadingStarted && state.account) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(state.account, state.provider, state.collectionContract, state.collectionCachedState, this.commit);
      }
      loadTiles(this.commit, collectionContract, collectionCachedState, providerId);
      fetchAccountBalance(state.account, state.provider, this.commit);
    },
    setTiles(state, {providerId, tiles, tilesByIndex}) {
      if (state.providerId !== providerId)
        return;

      state.tiles = tiles;
      state.tilesByIndex = tilesByIndex;
      state.collectionLoaded = true;
    },
    setTile(state, {providerId, tile}) {
      console.log('setTile', tile);
      if (state.providerId !== providerId)
        return;

      let tiles = state.tiles;
      tiles = tiles.filter(t => t.index !== tile.index);
      tiles.push(tile);
      state.tilesByIndex[tile.index] = tile;
      state.tiles = tiles;
      delete state.nftDataById[tile.nftId]
    },
    setConnectedAccount(state, address) {
      console.log('setConnectedAccount');
      state.account = address;
      state.venomBalance = '0';
      state.userNfts = [];

      state.tokenWalletContract = null;
      state.tokenWalletBalance = 0;
      state.tokenWalletSubscriber && state.tokenWalletSubscriber.unsubscribe();
      state.tokenWalletSubscriber = null;

      address && fetchAccountBalance(address, state.provider, this.commit);
      if (address && state.collectionCachedState) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(address, state.provider, state.collectionContract, state.collectionCachedState, this.commit);
      } else {
        state.userNftsLoadingStarted = false;
      }
      address && fetchUserTokenWalletBalance(address, state.provider, this.commit);
    },
    setTokenWallet(state, {address, tokenWalletContract, balance, subscriber}) {
      if (address.equals(state.account)) {
        state.tokenWalletContract = tokenWalletContract;
        state.tokenWalletBalance = balance;
        state.tokenWalletSubscriber = subscriber;
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
    setUserNfts(state, {address, nfts}) {
      if (state.account && state.account.equals(address)) {
        state.userNfts = nfts;
      }
    },
    setUserNftIsNotLoaded(state) {
      console.log('setUserNftIsNotLoaded')
      if (state.account && state.collectionContract) {
        state.userNftsLoadingStarted = true;
        // just reload
        fetchUserNfts(state.account, state.provider, state.collectionContract, state.collectionCachedState, this.commit);
      } else {
        state.userNftsLoadingStarted = false;
      }
    },
    setNftData(state, {id, description, url}) {
      // TODO think how to make better to trigger update
      let mapping = Object.assign({}, state.nftDataById) ;
      // TODO validate url
      mapping[id] = {description: description.slice(0, 2000), url: url.slice(0, 2000)};
      state.nftDataById = mapping;
    }
  },
  getters: {
    getNftDescriptionById: (state) => (id) => {
      let mapping = state.nftDataById;
      let nft = mapping[id];
      if (nft)
        return nft.description
      return '';
    }
  },
  actions:  {
    init({ state, commit }) {
      if (state.venomConnect)
        return;
      const venomConnect = new VenomConnect({
        theme: 'light',
        checkNetworkId: 1002, // 42 - ever main/dev, 1002 - venom devnet, 1 - venom mainnet
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
          everwallet: {
            links: {},
            walletWaysToConnect: [
              {
                // NPM package
                package: ProviderRpcClient,
                packageOptions: {
                  fallback:
                    VenomConnect.getPromise("everwallet", "extension") ||
                    (() => Promise.reject()),
                  forceUseFallback: true,
                },
                packageOptionsStandalone: {
                  fallback: standaloneFallback,
                  forceUseFallback: true,
                },
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
        },
      });
      commit('setVenomConnect', venomConnect);
      // Get standalone provider or  already connected wallet
      venomConnect.checkAuth().then(async (provider) => {
        await provider?.ensureInitialized();
        const currentProviderState = await provider?.getProviderState();
        console.log(provider);
        if (currentProviderState?.permissions?.basic && currentProviderState?.permissions?.accountInteraction) {
          console.log('Not standalone provider');
          commit('setProvider', provider);
          commit('setConnectedAccount', currentProviderState?.permissions?.accountInteraction?.address);
        } else {
          console.log('Standalone provider');
          let standAloneProvider = await venomConnect.getStandalone();
          commit('setProvider', standAloneProvider);
        }
      });

      venomConnect.on('extension-auth', async function (provider) {
        console.log('extension-auth');
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
      state.venomConnect.getStandalone().then(function (standAloneProvider) {
        console.log('Standalone provider');
        commit('setProvider', standAloneProvider);
      });
    },
    mintTokens({state, commit}, {amount}) {
      console.log('mint tokens', state.account);
      if (state.account === null) {
        // connect first
        state.venomConnect.connect();
        return;
      }
      const proxyOwnerContract = new state.provider.Contract(ProxyOwnerAbi, ProxyOwnerAddress);
      const promise = proxyOwnerContract.methods.mint({
        amount: amount,
        recipient: state.account,
        deployWalletValue: '150000000',
        remainingGasTo: state.account,
        notify: false,
        payload: ""
      }).send({
        from: state.account,
        amount: '300000000',
      })
      return new Promise((resolve, reject) => {
        promise.then(async (firstTx) => {
          const subscriber = new state.provider.Subscriber();
          await subscriber.trace(firstTx).tap(tx_in_tree => {
            // nothing
          }).finished();
          resolve();
        }).catch(reject)
      })
    },
    claimTiles({state, commit}, {x, y, width, height, tiles, description, url}) {
      if (state.account === null) {
        // connect first
        state.venomConnect.connect();
        return;
      }

      let price = width * height * 1000000000;

      return encodeMintPayload(state.provider,{
        "pixelStartX": x,
        "pixelStartY": y,
        "pixelEndX": x + width,
        "pixelEndY": y + height,
        "tilesToColorify": tiles,
        "description": description || 'Test description',
        "url": url || 'https://google.com',
        "coinsToRedrawOneTile" : (ColorifyOneTilePrice * 1_000_000_000).toString()
      }).then(function(paylaod) {
        return state.tokenWalletContract.methods.transfer({
          amount: price,
          recipient: CollectionAddress,
          deployWalletValue: '0',
          remainingGasTo: state.account,
          notify: true,
          payload: paylaod
        }).send({
          from: state.account,
          amount: Math.floor((width / 10 * height / 10 * ColorifyOneTilePrice + OneNftMintingCost + MaximumClaimGasPrice + MaximumFwdFeeForBigMint) * 1_000_000_000).toString(),
        })
      }).then(firstTx => {
        return new Promise(async (resolve, reject) => {
          const subscriber = new state.provider.Subscriber();
          await subscriber.trace(firstTx).tap(tx_in_tree => {
            // nothing
          }).finished();
          resolve();
        })
      })
    },
    redrawNft({state, commit}, {id, x, y, width, height, tiles, description, url}) {
      return state.collectionContract.methods.nftAddress({answerId: 0, id: id}).call({responsible: true, cachedState: state.collectionCachedState}).then(function(answer) {
        const nftContract = new state.provider.Contract(NftAbi, answer.nft);
        return nftContract.methods.colorify({
          "tilesToColorify": tiles,
          "description": description || '',
          "url": url || '',
          "sendGasBack": state.account,
          "coinsToRedrawOneTile" : (ColorifyOneTilePrice * 1_000_000_000).toString()
        }).send({
          from: state.account,
          amount: (Math.floor(width * height / 100 * ColorifyOneTilePrice * 1_000_000_000) + 1_000_000_000).toString(),
        }).then(function(firstTx) {
          return new Promise(async(resolve, reject) => {
            const subscriber = new state.provider.Subscriber();
            await subscriber.trace(firstTx).tap(tx_in_tree => {
              // nothing
            }).finished();
            resolve();
          })
        })
      })
    },
    fetchNftData({state, commit}, {id}) {
      if (!state.nftDataById[id] && state.provider && state.collectionCachedState) {
        commit('setNftDataLoadingInProgress', id);
        state.collectionContract.methods.nftAddress({
          id: id,
          answerId: 0
        }).call({
          responsible: true,
          cachedState: state.collectionCachedState
        }).then(answer => {
          let nftContract = new state.provider.Contract(NftAbi, answer.nft);
          return nftContract.methods.getNftCustomData({
            answerId: 0
          }).call({
            responsible: true
          })
          // console.log(answer);
        }).then(nftAnswer => {
          commit('setNftData', {id, description: nftAnswer.description, url: nftAnswer.url})
        })
      }
    }
  },
}


async function encodeMintPayload(provider, payload) {
  return (await provider.packIntoCell({
    data: {
      pixelStartX: payload.pixelStartX,
      pixelStartY: payload.pixelStartY,
      pixelEndX: payload.pixelEndX,
      pixelEndY: payload.pixelEndY,
      tilesToColorify: payload.tilesToColorify,
      description: payload.description,
      url: payload.url,
      coinsToRedrawOneTile: payload.coinsToRedrawOneTile
    },
    structure: [
      {name: 'pixelStartX', type: 'uint10'},
      {name: 'pixelStartY', type: 'uint10'},
      {name: 'pixelEndX', type: 'uint10'},
      {name: 'pixelEndY', type: 'uint10'},
      {"components":[{"name":"r","type":"uint80[]"},{"name":"g","type":"uint80[]"},{"name":"b","type":"uint80[]"}],"name":"tilesToColorify","type":"tuple[]"},
      {name: 'description', type: 'string'},
      {name: 'url', type: 'string'},
      {name: 'coinsToRedrawOneTile', type: 'uint128'}
    ],
  })).boc;
}
