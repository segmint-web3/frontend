<template>
  <div id="app" :class='pageClass'>
    <MyNftComponent v-if='myNftOpened' :onError='onError' :onClose='closeMyNfts' :openEditNft='openEditNft'/>
    <RulesModal name='rules-modal' />
    <MessageModal name='message-modal' :message='message'/>
    <ClaimModal name='mint-modal' :id='mintModalData.id' :width="mintModalData.selectedWidth" :height="mintModalData.selectedHeight" :x="mintModalData.selectionStartX" :y="mintModalData.selectionStartY" :onsuccess="onClaimModalSuccess" :onerror='onClaimModalError' @close="closeClaimModal"/>
    <LinkWarningModal name='link-warning-modal' :url='openLinkUrl' @close="closeLinkWarningModal"/>
    <HeaderComponent :openMyNfts='openMyNfts' :openFaq='openFaq' :isEditingMode='isEditingMode' :toggleEditingMode='toggleEditingMode' />
    <CanvasComponent ref='canvas' :isEditingMode='isEditingMode' :openMint='openMint' :openLink='openLink' />
    <div v-if='!collectionPreLoaded' class='loading-fullscreen'>
      <div>
        <img :src="`${publicPath}icons/logo.svg`" alt="logo" class="loading-logo">
        <h2 class='collection-name-header'>{{collectionName}} collection</h2>
        <p>Take your place in blockchain history!</p>
        <p class="loading-text">Loading collection...</p>
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
    <div v-if='isOutOfSync' class='loading-fullscreen'>
      <div>
        <h1>Your session expired, please refresh the page.</h1>
      </div>
    </div>
    <div v-if='isMintDisabled' class='loading-fullscreen'>
      <div>
        <h1>Currently Under Maintenance :( </h1>
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
import ClaimModal from '@/components/ClaimModal.vue'
import MessageModal from '@/components/MessageModal.vue'
import LinkWarningModal from '@/components/LinkWarningModal.vue'

export default {
  name: 'App',
  components: {
    MessageModal,
    ClaimModal,
    HeaderComponent,
    CanvasComponent,
    MyNftComponent,
    RulesModal,
    LinkWarningModal
  },
  data() {
    return {
      pageClass: '',
      collectionName: '',
      openLinkUrl: '',
      publicPath: process.env.BASE_URL,
      myNftOpened: false,
      isEditingMode: false,
      message: '',
      mintModalData: {
        id: null,
        selectedWidth: null,
        selectedHeight: null,
        selectionStartX: null,
        selectionStartY: null
      }
    }
  },
  computed: {
    collectionPreLoaded() {
      return this.$store.state.Provider.collectionPreLoaded;
    },
    isMintDisabled() {
      return this.$store.state.Provider.mintDisabled;
    },
    isOutOfSync() {
      return this.$store.state.Provider.collectionOutOfSync;
    }
  },
  mounted() {
    const validPages = AvailablePages;
    let pageInUrl;
    for (let page of validPages) {
      if (window.location.href.indexOf(page) === 8) {
        pageInUrl = page;
      }
    }
    if (validPages.indexOf(pageInUrl) === -1) {
      pageInUrl = localStorage.getItem('page');
    }
    if (validPages.indexOf(pageInUrl) === -1) {
      pageInUrl = validPages[Math.floor(Math.random() * 3)];
    }
    localStorage.setItem('page', pageInUrl);
    this.collectionName = pageInUrl;
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
    openLink(url) {
      console.log('open link');
      this.openLinkUrl = url;
      this.$modal.show('link-warning-modal');
    },
    openFaq(e) {
      this.$modal.show('rules-modal');
      e.preventDefault();
    },
    toggleEditingMode() {
      this.isEditingMode = !this.isEditingMode;
    },
    openEditNft(id, width, height, x, y) {
      this.mintModalData.id = id;
      this.mintModalData.selectedWidth = width;
      this.mintModalData.selectedHeight = height;
      this.mintModalData.selectionStartX = x;
      this.mintModalData.selectionStartY = y;
      this.$modal.show('mint-modal');
    },
    openMint(selectedWidth, selectedHeight,  selectionStartX, selectionStartY) {
      this.mintModalData.id = null;
      this.mintModalData.selectedWidth = selectedWidth;
      this.mintModalData.selectedHeight = selectedHeight;
      this.mintModalData.selectionStartX = selectionStartX;
      this.mintModalData.selectionStartY = selectionStartY;
      this.$modal.show('mint-modal');
    },
    onClaimModalSuccess() {
      this.$modal.hide('mint-modal');
      this.$refs.canvas.clearSelection();
    },
    onClaimModalError(errorMessage) {
      this.$modal.hide('mint-modal');
      this.onError(errorMessage);
      setTimeout(() => {
        this.$refs.canvas.clearSelection();
      }, 5000)
    },
    closeClaimModal() {
      this.$modal.hide('mint-modal');
    },
    closeLinkWarningModal() {
      this.$modal.hide('link-warning-modal');
    },
    onError(message) {
      this.message = message;
      this.$modal.show('message-modal');
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
  background-color: var(--sunrise);
  color: var(--yellow);
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
  margin: 30px 0 20px;
}
.loading-fullscreen .collection-name-header {
  font-size: 36px;
  margin-top: -15px;
  text-transform: capitalize;
}
.loading-logo {
  height: 300px;
}
@media only screen and (max-width: 768px) {
  .loading-logo {
    height: 200px;
  }
}
.global-page-style .loading-fullscreen {
  background-color: var(--midnight);
}

</style>
