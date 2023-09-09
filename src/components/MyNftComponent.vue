<template>
  <div class='full-screen-popup'>
    <div class='full-screen-popup-fade' @click='$props.onClose'></div>
    <div class="my-nft-wrapper">
      <div class='my-nft-header'>
        My NFTs
        <img :src="`${publicPath}icons/close.svg`" alt="close" class="close" @click='$props.onClose'>
      </div>
      <div class='my-nft-container'>
        <div v-for="nft in currentPageNfts" v-bind:key="nft.id" class='my-nft'>
          <OneNftComponent :collectionName='nft.collectionName' :onError='onErrorAndClose' :address='nft.address' :id='nft.id' :lockedAmount='nft.lockedAmount' :tileStartX='nft.tileStartX' :tileStartY='nft.tileStartY' :tileEndX='nft.tileEndX' :tileEndY='nft.tileEndY' :description='nft.description' :url='nft.url' :onedit='onEdit' />
        </div>
        <div v-for="nft in otherPagesNfts" v-bind:key="nft.id" class='my-nft'>
          <OneNftComponent :collectionName='nft.collectionName' :onError='onErrorAndClose' :address='nft.address' :id='nft.id' :lockedAmount='nft.lockedAmount' :tileStartX='nft.tileStartX' :tileStartY='nft.tileStartY' :tileEndX='nft.tileEndX' :tileEndY='nft.tileEndY' :description='nft.description' :url='nft.url' :onedit='onEdit' />
        </div>
      </div>
    </div>
<!--    <claim-modal name='edit-modal' :id='editNftId' :width="editNftWidth" :height="editNftHeight" :x="editNftX" :y="editNftY" :onsuccess="onModalSuccess" @close="closEditModal"/>-->
  </div>
</template>
<script>

import OneNftComponent from '@/components/OneNftComponent.vue'

export default {
  name: 'MyNftComponent',
  components: {
    OneNftComponent,
  },
  data () {
    return {
      publicPath: process.env.BASE_URL,
      editNftId: null,
      editNftWidth: null,
      editNftHeight: null,
      editNftX: null,
      editNftY: null,
      message: ""
    }
  },
  props: ['onClose', 'onError', 'openEditNft'],
  computed: {
    currentPageNfts() {
      return this.$store.state.Provider.userNfts.filter(n => n.collectionName === this.$store.state.Provider.page);
    },
    otherPagesNfts() {
      return this.$store.state.Provider.userNfts.filter(n => n.collectionName !== this.$store.state.Provider.page);
    },
    address() {
      return "";
    },
    nfts() {
      return this.$store.state.Provider.userNfts
    }
  },
  mounted(){
  },
  methods: {
    onErrorAndClose(message) {
      this.$props.onError(message);
      this.$props.onClose();
    },
    onEdit(id, x, y, width, height) {
      this.$props.openEditNft(id, width, height, x, y);
      this.$props.onClose();
    }
  }
}
</script>
<style scoped>
.my-nft-wrapper {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 90px;
  right: 0;
  bottom: 0;
  width: 300px;
  background: var(--sunrise);
  z-index: 8;
  color: var(--yellow);
}
.my-nft-header {
  color: var(--yellow);
  font-family: "ChakraPetch", Helvetica, Arial;
  font-size: 24px;
  font-weight: 700;
  height: 60px;
  text-align: center;
  width: 100%;
  flex: 0;
  padding-top: 5px;
}
.my-nft-container {
  font-family: "ChakraPetch", Helvetica, Arial;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: solid 8px var(--sunrise);
  background: var(--dark-night);
  box-sizing: border-box;
  overflow-y: scroll;
}


.my-nft {
  padding: 10px;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}
.close {
  width: 24px;
  height: 24px;
  position: absolute;
  right: 13px;
  top: 8px;
  cursor: pointer;
}
.full-screen-popup {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 92px;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}
.full-screen-popup-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}
</style>
