<template>
  <div class="header-wrapper">
    <div class="header-wide">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <a href="#" class="secondary-button mode-button" @click='$props.toggleEditingMode'>{{ isEditingMode ? 'View mode' : 'Mint mode' }}</a>
      <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='$props.openMyNfts'>My NFT</a>
      <a href="#" class="secondary-button faq-button" @click='$props.openFaq'>Rules</a>
    </div>
    <div class="header-mobile">
      <img :src="`${publicPath}icons/menu.svg`" alt="menu" class="menu" @click="toggleMobileMenu">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <div v-if="menuOpened" class="mobile-buttons">
        <a href="#" class="secondary-button mode-button" @click='this.toggleEditingModeMobile'>{{ isEditingMode ? 'View mode' : 'Mint mode' }}</a>
        <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='this.openMyNftsMobile'>My NFT</a>
        <a href="#" class="secondary-button faq-button" @click='this.openFaqMobile'>Rules</a>
      </div>
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
      publicPath: process.env.BASE_URL,
      menuOpened: false,
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
    toggleMobileMenu(){
      this.menuOpened = !this.menuOpened;
    },
    openMyNftsMobile() {
      this.menuOpened = false;
      this.openMyNfts();
    },
    openFaqMobile() {
      this.menuOpened = false;
      this.openFaq();
    },
    toggleEditingModeMobile() {
      this.menuOpened = false;
      this.toggleEditingMode();
    }
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
  height: 90px;
  padding: 10px 150px;
  box-sizing: border-box;
  background: #7000FF;
  z-index: 8;
  color: #CCFF00;
  border-bottom: solid 2px #CCFF00;
}

.logo {
    height: 70px;
    margin-right: 20px;
}
.mode-button {
  width: 150px;
  padding: 5px 10px;
  margin-right: 10px;
}

.nft-button {
  width: 120px;
  padding: 5px 10px;
}

.faq-button {
  margin-left: 10px;
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
@media screen and (max-width: 1280px){
  .header-wrapper {
    padding: 10px 50px;
  }
}
.header-mobile {
  display: none;
  position: relative;
}
@media only screen and (max-width: 900px) {
  .header-wide {
    display: none;
  }
  .header-mobile {
    display: flex;
    align-items: center;
  }
  .header-wrapper {
    padding: 10px 20px;
  }
}
@media only screen and (min-width: 900px) {
  .header-wide {
    display: flex;
    align-items: center;
  }
}
.menu {
  width: 50px;
  height: 50px;
}
.mobile-buttons {
  position: absolute;
  top: 90px;
  left: 0;
  display: flex;
  flex-direction: column;
  background: #7000FF;
  padding: 10px;
}
.header-mobile .secondary-button {
  margin: 5px 0;
}
</style>
