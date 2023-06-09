<template>
  <div class="header-wrapper">
    <div class="flex">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <a href="#" class="secondary-button nft-button" @click='$props.openMyNfts'>My NFT</a>
    </div>
    <div class="description">
      <span>$1 per pixel</span>
      <div class="dot"></div>
      <span>Own a piece of web3 history!</span>
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
  props: ['openMyNfts'],
  computed: {
    address() {
      let str = this.$store.state.Provider.account._address;
      return str.slice(0, 7) + '...' + str.slice(-4);
    },
    balance() {
      return this.$store.state.Provider.venomBalance;
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
  max-height: 100px;
  padding: 10px 150px;
  box-sizing: border-box;
  background: #7000FF;
  z-index: 8;
  color: #CCFF00;
  border-bottom: solid 2px #CCFF00;
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
.nft-button {
  width: 150px;
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
