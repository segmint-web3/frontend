<template>
  <div id="app">
    <CanvasComponent />
  </div>
</template>

<script>
import CanvasComponent from './components/CanvasComponent.vue'

export default {
  name: 'App',
  components: {
    CanvasComponent
  },
  mounted() {
    this.$store.dispatch('Provider/init', {});
  }
}
</script>

<style>
html, body {
  padding: 0;
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  //margin-top: 60px;
}
</style>
