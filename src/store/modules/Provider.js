/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/MillionDollarCollection.abi.json";
import NftAbi from "./abi/Nft.abi.json";
import {covertTileColorToPixels} from "@/utils/pixels";
import bigInt from "big-integer";
import {BN} from "bn.js";
import Vue from "vue";

const CollectionAddress = new Address("0:9839d6aa44562c00f0fb43a80069c4a9e9f60b2867c9a6101a9e9eb7feb7c3b3");

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
          pixels: Array(10 * 10 * 4).fill(255)
        }
        tiles.push(tile);
        tilesByIndex[index] = tile;
      }
    }
  }

  commit('Provider/setTiles', {providerId, tiles, tilesByIndex});
}

export const Provider = {
  namespaced: true,
  state: {
    venomConnect: null,
    provider: null,
    account: null,
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
    setNftData(state, {id, description, url}) {
      // TODO think how to make better to trigger update
      let mapping = Object.assign({}, state.nftDataById) ;
      mapping[id] = {description, url};
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
          let {value0: description, value1: url} = nftAnswer;
          commit('setNftData', {id, description, url})
        })
      }
    }
  },
}
