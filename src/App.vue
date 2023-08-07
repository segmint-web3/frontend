<template>
  <div id="app" :class='pageClass'>
    <rules-modal name='rules-modal' />
    <MyNftComponent v-if='myNftOpened' :onClose='closeMyNfts'/>
    <HeaderComponent :openMyNfts='openMyNfts' :openFaq='openFaq' :isEditingMode='isEditingMode' :toggleEditingMode='toggleEditingMode' />
    <CanvasComponent :isEditingMode='isEditingMode' />
    <div v-if='!collectionPreLoaded' class='loading-fullscreen'>
      <div>
        <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="loading-logo">
        <p>Take your place in blockchain history!</p>
        <p class="loading-text">Loading collection...</p>
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
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
import { AvailablePages } from '@/utils/pages'

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
      pageClass: '',
      publicPath: process.env.BASE_URL,
      myNftOpened: false,
      isEditingMode: false,
      message: 'Its okay to be not okay'
    }
  },
  computed: {
    collectionPreLoaded() {
      return this.$store.state.Provider.collectionPreLoaded;
    },
    isMintDisabled() {
      return this.$store.state.Provider.mintDisabled;
    }
  },
  mounted() {
    const validPages = AvailablePages;
    let pageInUrl = window.location.hash.slice(1);
    console.log('pageInUrl');
    if (validPages.indexOf(pageInUrl) === -1) {
      pageInUrl = localStorage.getItem('page');
    }
    if (validPages.indexOf(pageInUrl) === -1) {
      pageInUrl = validPages[Math.floor(Math.random() * 3)];
    }
    localStorage.setItem('page', pageInUrl);
    window.location.hash = pageInUrl;
    this.pageClass = 'global-page-style ' + pageInUrl;
    this.$store.dispatch('Provider/init', {page: pageInUrl});
    this.$modal.show('rules-modal');
  },
  methods: {
    closeMyNfts() {
      this.myNftOpened = false;
    },
    openMyNfts(e) {
      this.myNftOpened = true;
      e.preventDefault();
    },
    openFaq(e) {
      this.$modal.show('rules-modal');
      e.preventDefault();
    },
    toggleEditingMode(e) {
      this.isEditingMode = !this.isEditingMode;
      e.preventDefault();
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
  background-color: #7000FF;
  color: var(--primary);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  text-align: center;
  align-items: center;
}
.loading-fullscreen p{
  font-size: 32px;
  font-weight: 600;
  margin: 0;
}
p.loading-text {
  margin: 60px 0 20px;
}
.loading-logo {
  height: 300px;
}
@media only screen and (max-width: 768px) {
  .loading-logo {
    height: 200px;
  }
}
.global-page-style.desert .loading-fullscreen {
  background-color: rgba(112, 49, 49, 1);
}
.global-page-style.ocean .loading-fullscreen {
  background-color: rgba(52, 40, 126, 1);
}
.global-page-style.forest .loading-fullscreen {
  background-color: rgba(19, 82, 67, 1);
}

</style>
