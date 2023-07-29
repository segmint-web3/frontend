<template>
  <div class="header-wrapper">
    <div class="flex header-wide">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <a href="#" class="secondary-button faq-button" @click='$props.openFaq'>Rules</a>
      <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='$props.openMyNfts'>My NFT</a>
      <a href="#" class="secondary-button mode-button" @click='$props.toggleEditingMode'>{{ isEditingMode ? 'View mode' : 'Mint mode' }}</a>
    </div>
    <div class="flex header-mobile">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <a href="#" class="secondary-button mode-button" @click='$props.toggleEditingMode'>{{ isEditingMode ? 'View mode' : 'Mint mode' }}</a>
      <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='$props.openMyNfts'>My NFT</a>
      <a href="#" class="secondary-button faq-button" @click='$props.openFaq'>How To</a>
    </div>
    <div v-if="!$store.state.Provider.account" class="wallet-connect">
      <button class="primary-button connect" @click="connect">Connect wallet</button>
    </div>
    <div v-else class="flex wallet-info">
      <div class="info">
        <div class="address">{{ address }}</div>
        <div class="coins">{{ balance }} VENOM</div>
      </div>
      <img :src="`${publicPath}icons/exit.svg`" alt="exit" class="exit" @click="disconnect">
    </div>
  </div>
</template>
<script>
export default {
  name: 'HeaderComponent',
  data () {
    return {
      publicPath: process.env.BASE_URL
    }
  },
  props: ['openMyNfts', 'openFaq', 'isEditingMode', 'toggleEditingMode'],
  computed: {
    address() {
      let str = this.$store.state.Provider.account._address;
      return str.slice(0, 7) + '...' + str.slice(-4);
    },
    balance() {
      return this.$store.state.Provider.venomBalance;
    },
    epoch() {
      return this.$store.state.Provider.epoch;
    },
    pixelPrice() {
      let pixelPrice = parseInt(this.$store.state.Provider.currentTilePrice)/100_000_000_000;
      return (pixelPrice).toString()
    }
  },
  methods: {
    connect(){
      this.$store.dispatch('Provider/connect');
    },
    disconnect(){
      this.$store.dispatch('Provider/disconnect');
    },
  }
}
</script>
<style>
.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-height: 92px;
  padding: 10px 150px;
  box-sizing: border-box;
  background: #7000FF;
  z-index: 8;
  color: #CCFF00;
  border-bottom: solid 2px #CCFF00;
}

@media only screen and (max-width: 900px) {
  .header-wide {
    display: none !important;;
  }
}
.header-mobile {
  display: none !important;
}
@media only screen and (max-width: 900px) {
  .header-wide {
    display: flex !important;;
  }
}


@media screen and (max-width: 1280px){
  .header-wrapper {
    padding: 10px 50px;
  }
}
.logo {
    height: 70px;
    margin-right: 20px;
}
.mode-button {
  width: 150px;
  padding: 5px 10px;
  margin-left: 10px;
}

.nft-button {
  width: 120px;
  padding: 5px 10px;
}

.faq-button {
  margin-right: 10px;
  width: 100px;
  padding: 5px 10px;
}

.header-wrapper .description {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
  margin: 0 20px;
}
.dot {
  width: 8px;
  height: 8px;
  background-color: #CCFF00;
  margin: 20px;
}

.exit {
  height: 30px;
  margin-left: 10px;
  cursor: pointer;
}
.address {
  font-weight: 700;
}
.coins {
  text-align: end;
  color: var(--primary);
}
</style>
