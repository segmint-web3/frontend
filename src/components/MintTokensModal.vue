<template>
  <modal class="mint-tokens-modal" :name="$props.name" height="auto" @before-close="beforeClose">
    <div class="flex modal-content">
      <div class="mint-tokens-modal-header">
        Minting Test USD
        <img :src="`${publicPath}icons/close.svg`" alt="close" class="close" @click="$emit('close')">
      </div>
      <div class=" flex mint-tokens-modal-content">
        <div v-if="mintIntProgress" style="background-color: rgba(0, 0, 0, 0.3); position: absolute; left: 0; right: 0; top:0; bottom: 0;"></div>
        <div v-else class="instructions">
            There is no real USDT in devnet by now :-(
            <br />
            So you need to mint some testUSD to continue
        </div>
        <form>
          <button class="primary-button" v-on:click="mint">
            Mint tokens
          </button>
        </form>
        <div v-if='mintIntProgress' class="mint-in-progress">
          <span>Mint in progress</span>
          <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>

export default {
  name: 'MintTokensModal',
  data: function () {
    return {
      mintIntProgress: false,
      publicPath: process.env.BASE_URL
    }
  },
  props: ['amount', 'onsuccess', 'name'],
  computed: {
  },
  methods: {
    mint(event) {
      event.preventDefault();
      if (this.mintIntProgress)
        return

      let promise = this.$store.dispatch('Provider/mintTokens', {amount: this.$props.amount});
      if (promise) {
        this.mintIntProgress = true;
        promise.then(() => {
          this.mintIntProgress = false;
          this.$props.onsuccess();
        }).catch((err) => {
          console.log(err);
          this.mintIntProgress = false;
        })
      }
    },
    beforeClose(event) {
      if (this.mintIntProgress)
        event.cancel();
    }
  }
}
</script>

<style scoped>
.mint-tokens-modal {
  background-color: rgb(59 0 135 / 50%);
}
.mint-tokens-modal-header {
  width: 100%;
  padding: 0 10px 10px 10px;
  text-align: center;
  background: #7000FF;
  color: var(--primary);
  font-family: "ChakraPetch", Helvetica, Arial;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}
.mint-tokens-modal-header img.close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.modal-content {
  position: fixed;
  top: 15%;
  left: calc(50% - 166px);
  flex-direction: column;
  min-width: 300px;
  background-color: #21004B;
  border: 10px solid #7000FF;
  color: #CCFF00;
}
.mint-tokens-modal-content {
  flex-direction: column;
  padding: 20px;
}
.instructions {
  font-weight: 700;
  margin: 0 20px 20px;
  text-align: center;
}
form {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}
form label {
  width: 60px;
}
form button {
  width: 200px;
  align-self: center;
  margin-top: 20px;
}
.mint-in-progress {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #21004B;
  color: var(--primary);
  font-weight: 700;
  display: flex;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  align-items: center;
  font-size: 40px;
}
.mint-in-progress span {
  display: block;
  width: 100%;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid var(--primary);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--primary) transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
