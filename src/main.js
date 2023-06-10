import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vmodal from 'vue-js-modal'
import "./styles/main.css"
// import panZoom from 'vue-panzoom'

Vue.use(vmodal)
// Vue.use(panZoom);
Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
