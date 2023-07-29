<template>
  <div id="app">
    <MyNftComponent v-if='myNftOpened' :onClose='closeMyNfts'/>
    <HeaderComponent :openMyNfts='openMyNfts' :isEditingMode='isEditingMode' :toggleEditingMode='toggleEditingMode' />
    <CanvasComponent :isEditingMode='isEditingMode' />
    <div v-if='!isCollectionLoaded' class='loading-fullscreen'>
      <div>
        <h1>Loading collection</h1>
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
  </div>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import CanvasComponent from './components/CanvasComponent.vue'
import MyNftComponent from "@/components/MyNftComponent.vue";

export default {
  name: 'App',
  components: {
    HeaderComponent,
    CanvasComponent,
    MyNftComponent
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
    }
  },
  mounted() {
    this.$store.dispatch('Provider/init', {});
  },
  methods: {
    closeMyNfts() {
      this.myNftOpened = false;
    },
    openMyNfts() {
      this.myNftOpened = true;
    },
    toggleEditingMode() {
      this.isEditingMode = !this.isEditingMode;
    },
    showError(message) {
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
  background-color: #3B0087;
  box-sizing: border-box;
}
#app {
  font-family: "ChakraPetch", Helvetica, Arial;
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
</style>
