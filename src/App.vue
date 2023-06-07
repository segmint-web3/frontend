<template>
  <div id="app">
    <MyNftComponent v-if='myNftOpened' :onClose='closeMyNfts'/>
    <HeaderComponent :openMyNfts='openMyNfts' />
    <CanvasComponent />
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
    }
  },
  mounted() {
    this.$store.dispatch('Provider/init', {});
  },
  methods: {
    closeMyNfts(){
      this.myNftOpened = false;
    },
    openMyNfts(){
      this.myNftOpened = true;
    },
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
</style>
