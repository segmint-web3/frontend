/* eslint-disable */
import {VenomConnect} from "venom-connect";
import {Address, ProviderRpcClient} from "everscale-inpage-provider";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import CollectionAbi from "./abi/SegmintCollection.abi.json";
import NftAbi from "./abi/SegmintNft.abi.json";
import IndexAbi from "./abi/Index.abi.json";
import BlockListAbi from "./abi/BlockList.abi.json";

import {
  getMainBackgroundTileColor, getMainForegroundTileColor, tryToDecodeTile
} from '@/utils/pixels'
import {BN} from "bn.js";

const Pages ={
  ocean: {
    collection: new Address("0:1a98a60471cb91af9f7c47063c2d2a5c4df325b28d53f3b3b2d05bcc5e6b81b8"),
    blocklist: new Address("0:84ce0db6019a06bf3cc8b1ac7a626993981bca23d7c6e97843735dd383093a28")
  },
  desert: {
    collection: new Address("0:7f640c417b44e1a0bd870b502a47292572b78a33dfccc6c63c67c171d6505aaa"),
    blocklist: new Address("0:28fa45ac10075d1296813589b45bfa48e33ab0faaef0ea9f743170b299b293f4")
  },
  forest: {
    collection: new Address("0:e607b54636f6d26b92f52f4c8ad2e013eee4415ef151f0881e275abf79aaebd7"),
    blocklist: new Address("0:9d3d68646544dd2344ff4e18220f5cd466ec8cb2c8380e31c0676978c97dd8df")
  }
}

const nftCode = '';

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
      group: "dev",
      type: "jrpc",
      data: {
        endpoint: "https://jrpc-testnet.venom.foundation/"
      },
    },
  });

async function loadCollection(provider, page, commit) {
  let collectionSubscriber;
  try {
    // Is cached state loaded
    let stateLoaded = false;

    collectionSubscriber = new provider.Subscriber()
    // Subscribe at first
    const collectionContract = new provider.Contract(CollectionAbi, Pages[page].collection);
    const blockListContract = new provider.Contract(BlockListAbi, Pages[page].blocklist);

    let {fields: blockedListParsedState} = await blockListContract.getFields({});
    let blockedNftById = {};

    for (let item of blockedListParsedState.blocked_) {
      blockedNftById[item[0]] = true;
      commit('Provider/addBlockedNft', { id: item[0] });
    }

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

    let updatesToAddAfterStateIsLoaded = [];
    collectionSubscriber.transactions(collectionContract.address).on(async (data) => {
      console.log('We got a new transactions on collection address', data);
      for (let tx of data.transactions.reverse()) {
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
            if (stateLoaded) {
              commit('Provider/setTile', { tile: tile });
            } else {
              updatesToAddAfterStateIsLoaded.push({
                type: 'Provider/setTile',
                data: { tile: tile }
              })
            }
          } else if (event.event === 'NftMinted') {
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
                if (stateLoaded) {
                  commit('Provider/setTile', { tile: tile });
                } else {
                  updatesToAddAfterStateIsLoaded.push({
                    type: 'Provider/setTile',
                    data: { tile: tile }
                  })
                }
              }
            }
          } else if (event.event === 'MintDisabledChanged') {
            // We catch only newValue = true, because user must refresh the page
            // to start claim again
            if (event.data.newValue) {
              if (stateLoaded) {
                commit('Provider/setMintDisabled', event.data.newValue);
              } else {
                updatesToAddAfterStateIsLoaded.push({
                  type: 'Provider/setMintDisabled',
                  data: event.data.newValue
                })
              }
            }
          } else if (event.event === 'EpochChanged') {
            if (stateLoaded) {
              commit('Provider/setEpoch', { epoch: event.data.newEpoch, price: event.data.oneTileClaimPrice });
            } else {
              updatesToAddAfterStateIsLoaded.push({
                type: 'Provider/setEpoch',
                data: { epoch: event.data.newEpoch, price: event.data.oneTileClaimPrice }
              })
            }
          }
        }
      }
    });

    // to give time subscriber to subscribe
    await new Promise(function(resolve, reject) {
      setTimeout(resolve, 50);
    })

    let seconds = Date.now();
    console.log('get new state');
    const { state: collectionCachedState } = await collectionContract.getFullState();
    console.log('state got', ((Date.now() - seconds)/1000).toFixed(1));

    // load tiles
    let tilesColorsByIndex = {};
    let tilesByIndex = {};

    let {fields: parsedState} = await collectionContract.getFields({allowPartial: true, cachedState: collectionCachedState});
    console.log('state parsed', ((Date.now() - seconds)/1000).toFixed(1));

    await new Promise((resolve) => setTimeout(resolve, 1));

    commit('Provider/setEpoch', { epoch: parsedState.currentEpoch_, price: parsedState.currentEpochTilePrice_ });
    commit('Provider/setMintDisabled', parsedState.mintDisabled_);
    commit('Provider/setCollection', { collectionContract, collectionCachedState, nftTvc: await provider.codeToTvc(parsedState._codeNft) });

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
    await new Promise((resolve) => setTimeout(resolve, 1));

    stateLoaded = true;
    commit('Provider/setCollectionLoaded');

    // rollup pending events
    for (let event of updatesToAddAfterStateIsLoaded) {
      commit(event.type, event.data);
    }
    console.log('Collection loaded', ((Date.now() - seconds)/1000).toFixed(1));
  } catch (e) {
    console.log('load collection error', e);
    collectionSubscriber && collectionSubscriber.unsubscribe();
    setTimeout(function() {
      loadCollection(provider, page, commit);
    }, 10000)
  }
}

async function fetchAccountBalance(address, provider, commit) {
  provider.getBalance(address).then(function(balance) {
    if (balance) {
      commit('Provider/setAccountBalance', {address, balance: (balance / 1_000_000_000).toFixed(1)});
    }
  })
}

async function fetchUserNft(id, nftTvc, userAddress, provider, commit) {
  const {address: nftAddress} = await provider.getStateInit(NftAbi, {
    workchain: 0,
    tvc: nftTvc,
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

async function fetchUserNfts(userAddress, provider, nftTvc, collectionContract, collectionCachedState, commit) {

  console.log('Fetch users nfts!!!');
  const {codeHash: indexCodeHash} = await collectionContract.methods.getNftIndexCodeHash({answerId: 0, _owner: userAddress}).call({responsible: true, cachedState: collectionCachedState})
  console.log('Got init code hash');
  const {accounts: userNftsContracts} = await provider.getAccountsByCodeHash({codeHash: indexCodeHash});
  console.log('Got accounts');

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
          const {address: expectedNftAddress} = await provider.getStateInit(NftAbi, { workchain: 0, tvc: nftTvc, initParams: { _id: nftInfo.id } });
          if (expectedNftAddress.equals(nftAddress)) {
            commit('Provider/setUserNft', {
              userAddress: userAddress,
              nft: {
                address: nftAddress,
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
    collectionCachedState: null,
    collectionPreLoaded: false,
    collectionLoaded: false,
    nftTvc: undefined,
    epoch: 0,
    currentTilePrice: 0,
    setTileCounter: 0, // counter to reactive update bad tiles in selections
    mintDisabled: false,
    tilesByIndex: {},
    nftDataById: {},
    blockedNftById: {}
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
      loadCollection(provider, state.page, this.commit);
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
    setCollection(state, {collectionContract, collectionCachedState, nftTvc}) {
      state.collectionContract = collectionContract;
      state.collectionCachedState = collectionCachedState;
      state.nftTvc = nftTvc
      state.collectionPreLoaded = true;
      state.account && fetchAccountBalance(state.account, state.provider, this.commit);
    },
    setCollectionLoaded(state) {
      state.collectionLoaded = true;
      if (!state.userNftsLoadingStarted && state.account) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(state.account, state.standaloneProvider, state.nftTvc, state.collectionContract, state.collectionCachedState, this.commit);
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
        fetchUserNft(id, state.nftTvc, owner, state.provider, this.commit);
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
      }, 15 *1000));
      if (address && state.collectionCachedState) {
        state.userNftsLoadingStarted = true;
        fetchUserNfts(address, state.standaloneProvider, state.collectionContract, state.collectionCachedState, this.commit);
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
      }
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
    changePage({state}, {newPage}) {
      window.location.hash = newPage;
      localStorage.setItem('page', newPage);
      window.reload();
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
        amount: Math.floor( ((tileEndX - tileStartX) * (tileEndY - tileStartY)) * parseInt(state.currentTilePrice) + (MaximumFwdFeeForBigMint + OneNftMintingCost + MaximumClaimGasPrice) * 1_000_000_000).toString(),
      }).then(firstTx => {
        return new Promise(async (resolve, reject) => {
          let nftMinted = false;
          let txs = [];
          const subscriber = new state.standaloneProvider.Subscriber();
          await subscriber.trace(firstTx).tap(tx_in_tree => {
            if (tx_in_tree.account.equals(Pages[state.page].collection)) {
              txs.push(tx_in_tree);
            }
          }).finished();
          for (let tx of txs) {
            let events = await state.collectionContract.decodeTransactionEvents({ transaction: tx });
            for (let event of events) {
                if (event.event === 'NftMinted') {
                  nftMinted = true;
                  fetchUserNft(event.data.nftId, state.nftTvc, event.data.owner, state.provider, commit);

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
          if (nftMinted) {
            resolve();
          } else {
            reject(new Error('Nft not minted :-(. Price changed or space occupied.'));
          }
        })
      })
      return promise;
    },
    redrawNft({state, commit}, {id, tiles, description, url}) {
      let collection = new state.provider.Contract(CollectionAbi, Pages[state.page].collection);
      if (url.toLowerCase().indexOf('http') !== 0) {
        url = 'http://' + url;
      }
      return collection.methods.nftAddress({answerId: 0, id: id}).call({responsible: true, cachedState: state.collectionCachedState}).then(function(answer) {
        const nftContract = new state.provider.Contract(NftAbi, answer.nft);
        return nftContract.methods.colorify({
          "colors": tiles,
          "description": description || '',
          "url": url || '',
        }).send({
          from: state.account,
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
        return nftContract.methods.burnNft({}).send({
          from: state.account,
          amount: (BurnNftValue * 1_000_000_000).toString(),
        }).then(function(firstTx) {
          commit('removeUserNft', id);
        })
      })
    },
    fetchNftData({state, commit}, {id}) {
      console.log('fetchNftData', id);
      if (state.blockedNftById[id] === true) {
        commit('setNftData', {id, description: 'This nft is blocked on frontend side due to unappropriated content', url: 'https://segmint.app/'})
        return;
      }
      if (!state.nftDataById[id] && state.standaloneProvider && state.collectionCachedState) {
        commit('setNftDataLoadingInProgress', id);
        state.standaloneProvider.getStateInit(NftAbi, {
          workchain: 0,
          tvc: state.nftTvc,
          initParams: {
            _id: id
          }
        }).then(function(data) {
          let nftContract = new state.standaloneProvider.Contract(NftAbi, data.address);
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
