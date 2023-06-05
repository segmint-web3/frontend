<template>
  <div class="header-wrapper">
    <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
    <a href="" class="secondary-button nft-button">My NFT</a>
    <div class="description">
      <span>$1 per pixel</span>
      <div class="dot"></div>
      <span>Own a piece of web3 history!</span>
    </div>
    <div v-if="!$store.state.Provider.account" class="wallet-connect">
      <button class="primary-button connect" @click="connect">Connect wallet</button>
    </div>
    <div v-else class="wallet-info">
      <div class="info">
        <div class="address">{{ address }}</div>
        <div class="coins"></div>
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
  computed: {
    address() {
      let str = this.$store.state.Provider.account._address;
      return str.slice(0, 7) + '...' + str.slice(-4);
    }
  },
  mounted(){
    console.log(this.$store.state.Provider)
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  top: 0;
  left: 0;
  width: 100%;
  max-height: 100px;
  background: #7000FF;
  z-index: 8;
  color: #CCFF00;
}
.logo {
    height: 70px;
    margin-right: 20px;
}
.nft-button {
  width: 150px;
  padding: 5px 10px;
}

.description {
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
.wallet-info {
  display: flex;
}
.address {
  font-weight: 700;
}
</style>