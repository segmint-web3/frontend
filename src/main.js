import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vmodal from 'vue-js-modal'

Vue.use(vmodal)
Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
