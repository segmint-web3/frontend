<template>
  <div id="app">
    <rules-modal name='rules-modal' />
    <MyNftComponent v-if='myNftOpened' :onClose='closeMyNfts'/>
    <HeaderComponent :openMyNfts='openMyNfts' :openFaq='openFaq' :isEditingMode='isEditingMode' :toggleEditingMode='toggleEditingMode' />
    <CanvasComponent :isEditingMode='isEditingMode' />
    <div v-if='!isCollectionLoaded' class='loading-fullscreen'>
      <div>
        <h1>Loading collection</h1>
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        <h2 class='fun-fact'>Fact of the day: <br /> <br /> Segmint is a pure web3 app. We don't use third-party services or IPFS. We store all data on the blockchain and only read from the blockchain.</h2>
      </div>
    </div>
    <div v-if='isMintDisabled' class='loading-fullscreen'>
      <div>
        <h1>We under maintenance :-(</h1>
      </div>
    </div>
  </div>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import CanvasComponent from './components/CanvasComponent.vue'
import MyNftComponent from "@/components/MyNftComponent.vue";
import RulesModal from "@/components/RulesModal.vue";

export default {
  name: 'App',
  components: {
    HeaderComponent,
    CanvasComponent,
    MyNftComponent,
    RulesModal
  },
  data() {
    return {
      myNftOpened: false,
      isEditingMode: false,
      message: 'Its okay to be not okay'
    }
  },
  computed: {
    isCollectionLoaded() {
      return this.$store.state.Provider.collectionLoaded;
    },
    isMintDisabled() {
      return this.$store.state.Provider.mintDisabled;
    }
  },
  mounted() {
    this.$store.dispatch('Provider/init', {});
    this.$modal.show('rules-modal');
  },
  methods: {
    closeMyNfts() {
      this.myNftOpened = false;
    },
    openMyNfts() {
      this.myNftOpened = true;
    },
    openFaq() {
      this.$modal.show('rules-modal');
    },
    toggleEditingMode() {
      this.isEditingMode = !this.isEditingMode;
    }
  }
}
</script>

<style>
@font-face {
  font-family: "ChakraPetch";
  src: local("ChakraPetch"),
   url(../public/fonts/ChakraPetch-Regular.ttf) format("truetype");
}
html, body {
  padding: 0;
  margin: 0;
  background-color: #3B0087;
  box-sizing: border-box;
}
#app {
  font-family: "ChakraPetch", Helvetica, Arial;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}
.loading-fullscreen {
  z-index: 1000;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #3B0087;
  color: var(--primary);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  text-align: center;
  align-items: center;
}
.fun-fact {
  max-width: 400px;
  padding: 10px;
}
</style>
