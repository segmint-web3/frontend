/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/SegmintCollection.abi.json";
import NftAbi from "./abi/SegmintNft.abi.json";
import IndexAbi from "./abi/Index.abi.json";
import {covertTileColorToPixels} from "@/utils/pixels";
import bigInt from "big-integer";
import {BN} from "bn.js";
import Vue from "vue";

const CollectionAddress = new Address("0:d3712cae0163630873fcfa00d6f84159780a5bfe825ee8d932523632b4ba5cb7");

const standaloneFallback = () =>
  EverscaleStandaloneClient.create({
    connection: {
      id: 42,
      group: "dev",
      type: "graphql",
      data: {
        endpoints: ["https://devnet.evercloud.dev/ccb89dc0493c4edd9f6d7b5e27d73aef/graphql"],
        latencyDetectionInterval: 1000,
        local: false,
      },
    },
  });

async function providerChanged(provider, providerId, commit) {
  console.log('get new state');
  const collectionContract = new provider.Contract(CollectionAbi, CollectionAddress);
  const {state: collectionCachedState} = await collectionContract.getFullState();

  console.log('state got')
  const collectionSubscriber = new provider.Subscriber();
  // ug
  let waitToColorify = [];
  collectionSubscriber.transactions(collectionContract.address).on(async (data) => {
    console.log('We got a new transaction on collection address', data);
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
      state.collectionLoaded = false;
      state.tiles = [];

      // unsubscribe previous provider
      state.providerSubscriber && state.providerSubscriber.unsubscribe();
      state.providerSubscriber = null;

      state.provider = provider;
      state.provider.subscribe('networkChanged').then((subscriber) => {
        subscriber.on('data', (event) => {
          // reinit tiles on network changed.
          providerChanged(provider, state.providerId, this.commit);
        });
      })
      providerChanged(provider, state.providerId, this.commit);
    },
    setCollection(state, {providerId, collectionContract, collectionCachedState, collectionSubscriber}) {
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
    },
    setTiles(state, {providerId, tiles, tilesByIndex}) {
      console.log('setTile', tiles);

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
      state.account = address;
      state.venomBalance = '0';
      state.userNfts = [];
      address && fetchAccountBalance(address, state.provider, this.commit);
      if (address && state.collectionCachedState) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(address, state.provider, state.collectionContract, state.collectionCachedState, this.commit);
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
    init ({ state, commit }) {
      if (state.venomConnect)
        return;
      const venomConnect = new VenomConnect({
        theme: 'light',
        checkNetworkId: 42, // 42 - ever main/dev, 1000 - venom testnet, 1 - venom mainnet
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
        const currentProviderState = await provider?.getProviderState();
        if (currentProviderState?.permissions?.accountInteraction) {
          commit('setProvider', provider);
          commit('setConnectedAccount', currentProviderState?.permissions?.accountInteraction?.address);
        } else {
          let standAloneProvider = await venomConnect.getStandalone();
          console.log('Standalone provider');
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
    claimTiles({state, commit}, {x, y, width, height, tiles, description, url}) {
      if (state.account === null) {
        // connect first
        state.venomConnect.connect();
        return;
      }
      const promise = state.collectionContract.methods.claimTiles({
        "pixelStartX": x,
        "pixelStartY": y,
        "pixelEndX": x + width,
        "pixelEndY": y + height,
        "tilesToColorify": tiles,
        "description": description || 'Test description',
        "url": url || 'https://google.com'
      }).send({
        from: state.account,
        amount: (width * height / 100 * 400_000_000 + 3_000_000_000).toString(),
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
    redrawNft({state, commit}, {id, x, y, width, height, tiles, description, url}) {
      return state.collectionContract.methods.nftAddress({answerId: 0, id: id}).call({responsible: true, cachedState: state.collectionCachedState}).then(function(answer) {
        const nftContract = new state.provider.Contract(NftAbi, answer.nft);
        return nftContract.methods.colorify({
          "tilesToColorify": tiles,
          "description": description || '',
          "url": url || '',
          "sendGasBack": state.account
        }).send({
          from: state.account,
          amount: (width * height / 100 * 400_000_000 + 3_000_000_000).toString(),
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
