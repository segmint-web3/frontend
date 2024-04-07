<template>
  <div class="header-wrapper">
    <div class="header-wide">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='$props.openMyNfts'>My NFT</a>
      <a href="#" class="secondary-button faq-button" @click='$props.openFaq'>Rules</a>
      <a v-if="$store.state.Provider.king.kingContract" href="#" class="secondary-button king-button" @click='$props.openKingRules'>KING?</a>
    </div>
    <div class="header-mobile">
      <img :src="`${publicPath}icons/menu.svg`" alt="menu" class="menu" @click="toggleMobileMenu">
      <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="logo">
      <div v-if="menuOpened" class="mobile-buttons">
        <div class="flex mobile-switch-wrapper">
          <label for="switch" class="label">Mint mode</label>
          <label class="mode-switch">
            <input type="checkbox" id="switch" :checked="this.$props.isEditingMode" @change="toggleMode($event)">
            <span class="slider"></span>
          </label>
        </div>
        <a v-if="$store.state.Provider.account" href="#" class="secondary-button nft-button" @click='this.openMyNftsMobile'>My NFT</a>
        <a href="#" class="secondary-button faq-button" @click='this.openFaqMobile'>Rules</a>
        <a v-if="$store.state.Provider.king.kingContract" href="#" class="secondary-button king-button" @click='$props.openKingRules'>KING?</a>
      </div>
    </div>
    <div class="flex">
      <div class="mode-switch-wrapper">
        <label for="switch" class="label">Mint mode</label>
        <label class="mode-switch">
          <input type="checkbox" id="switch" :checked="this.$props.isEditingMode" @change="toggleMode($event)">
          <span class="slider"></span>
        </label>
      </div>
      <div v-if="!$store.state.Provider.account" class="wallet-connect">
        <button class="primary-button connect" @click="connect">Connect wallet</button>
      </div>
      <div v-else class="flex wallet-info">
        <div class="info">
          <div class="address">{{ address }}</div>
          <div class="coins">{{ balance }} VENOM</div>
        </div>
        <img :src="`${publicPath}icons/exit.svg`" alt="exit" class="exit secondary-button" @click="disconnect">
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name: 'HeaderComponent',
  data () {
    return {
      publicPath: process.env.BASE_URL,
      pagesDropdownVisible: false,
      menuOpened: false,
      mintMode: false
    }
  },
  props: ['openMyNfts', 'openFaq', 'openKingRules', 'isEditingMode', 'toggleEditingMode'],
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
    chooseSecondPage(e) {
      e.preventDefault();
      this.$store.dispatch('Provider/changePage', {newPage: this.secondPage});
    },
    chooseThirdPage(e) {
      e.preventDefault();
      this.$store.dispatch('Provider/changePage', {newPage: this.thirdPage});
    },
    togglePagesDropdown(e) {
      e.preventDefault();
      this.pagesDropdownVisible = !this.pagesDropdownVisible;
    },
    connect(){
      this.$store.dispatch('Provider/connect');
    },
    disconnect(){
      this.$store.dispatch('Provider/disconnect');
    },
    toggleMobileMenu(){
      this.menuOpened = !this.menuOpened;
    },
    openMyNftsMobile(e) {
      e.preventDefault();
      this.menuOpened = false;
      this.openMyNfts();
    },
    openFaqMobile(e) {
      e.preventDefault();
      this.menuOpened = false;
      this.openFaq();
    },
    toggleMode(){
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
  height: 80px;
  padding: 10px 150px;
  box-sizing: border-box;
  background: var(--sunrise);
  z-index: 8;
  color: var(--yellow);
  border-bottom: solid 2px var(--yellow);
}

.logo {
    height: 70px;
    margin-right: 10px;
}
.page-button {
  width: 45.5px;
  height: 45.5px;
  margin-right: 10px;
  box-sizing: border-box;
}
.page-button.desert {
  background-color: #703131;
}
.page-button.forest {
  background-color: #135243;
}
.page-button.ocean {
  background-color: #34287E;
}
.page-button-container {
  position: relative;
}
.page-button.page-button-dropdown-first {
  position: absolute;
  top: 55.5px;
}
.page-button.page-button-dropdown-second {
  position: absolute;
  top: 112.5px;
}
.page-button.with-icon {
  background-position: 50%;
  background-size: contain;
  border-color: transparent;
}
.page-button.without-icon {
  background-image: none !important;
}

.mobile-open-page-button {
  text-transform: capitalize;
  padding: 5px;
  margin-right: 10px;
}

.nft-button {
  width: 120px;
  padding: 5px;
  text-transform: uppercase;
}

.faq-button {
  margin-left: 10px;
  width: 100px;
  padding: 5px;
  text-transform: uppercase;
}

.king-button {
  margin-left: 10px;
  width: 100px;
  padding: 5px;
  text-transform: uppercase;
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
  background-color: var(--yellow);
  margin: 20px;
}

.exit {
  height: 35px;
  margin-left: 10px;
  cursor: pointer;
}
.address {
  font-weight: 700;
}
.coins {
  text-align: end;
  color: var(--yellow);
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
  .header-wide, .mode-switch-wrapper {
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
  .mode-switch-wrapper {
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
  background: var(--sunrise);
  padding: 10px;
  width: 215px;
}
.mobile-buttons .secondary-button {
  width: 190px;
  padding: 5px 10px;
}
.header-mobile .secondary-button {
  margin: 5px 0;
}
.mode-switch-wrapper {
  margin: 0 30px;
}
.mobile-buttons .mobile-switch-wrapper {
  display: flex;
  justify-content: space-between;
  margin: 0 0 10px 0;
}
.mode-switch-wrapper .label, .mobile-switch-wrapper .label {
  margin-right: 10px;
  font-size: 24px;
  font-weight: 500;
  line-height: 30px;
  cursor: pointer;
  text-transform: uppercase;
}
.mode-switch {
  position: relative;
  display: inline-block;
  width: 63px;
  height: 33px;
}
.mode-switch input {
  display:none;
}
.mode-switch .slider {
  position: absolute;
  cursor: pointer;
  width: 63px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--midnight);
  border: 2px solid var(--yellow);
  -webkit-transition: .4s;
  transition: .4s;
  box-sizing: border-box;
}

.mode-switch .slider:before {
  position: absolute;
  content: "";
  height: 30px;
  width: 30px;
  top: 0;
  left: 0;
  background-color: var(--yellow);
  border: 2px solid var(--midnight);
  -webkit-transition: .4s;
  transition: .4s;
  box-sizing: border-box;
}

.mode-switch input:checked + .slider {
  background-color: var(--yellow);
}

.mode-switch input:focus + .slider {
  box-shadow: 0 0 1px var(--yellow);
}

.mode-switch input:checked + .slider:before {
  -webkit-transform: translateX(30px);
  -ms-transform: translateX(30px);
  transform: translateX(30px);
}
</style>
