<template>
  <div id="app">
    <HeaderComponent />
    <CanvasComponent />
  </div>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import CanvasComponent from './components/CanvasComponent.vue'

export default {
  name: 'App',
  components: {
    HeaderComponent,
    CanvasComponent
  },
  mounted() {
    this.$store.dispatch('Provider/init', {});
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
}
#app {
  font-family: "ChakraPetch", Helvetica, Arial;
}
</style>
