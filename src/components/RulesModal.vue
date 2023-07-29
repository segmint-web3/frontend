<template>
  <modal class="rules-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex message-modal-content">
        <div class="instructions">
          <h2 class="instructions-title">How it works</h2>
          <div>
            <p> On Segmint you can colorify pixels on public board to get NFT</p>
            <p>Each time the board is nearly full the next season begins.  And users will claim pixels over the old canvas</p>
            <p>If your NFT is completely painted over, you can burn it and get your tokens back. Every season the price goes up linearly</p>
            <p>Your nft can be locked in case of inappropriate content</p>
          </div>
        </div>
        <button class="primary-button" v-on:click="this.close">
          OK
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
export default {
  name: 'RulesModal',
  data: function () {
    return {}
  },
  props: ['name'],
  computed: {},
  methods: {
    close() {
      this.$modal.hide(this.name);
    }
  },

}
</script>

<style scoped>
.message-modal {
  background-color: rgb(59 0 135 / 50%);
  z-index: 9;
}
.modal-content {
  position: fixed;
  top: 15%;
  left: calc(50% - 170px);
  flex-direction: column;
  width: 340px;
  background-color: #21004B;
  border: 10px solid #7000FF;
  color: #CCFF00;
  box-sizing: border-box;
}
.message-modal-content {
  flex-direction: column;
  padding: 20px;
}
.instructions {
  font-weight: 700;
  font-size: 24px;
  margin: 0 20px;
  text-align: left;
}
.primary-button {
  padding: 5px 50px;
  margin-bottom: 20px;
}
.instructions-title {
  margin: 20px 0;
}
.modal-content {
  position: fixed;
  top: 15%;
  left: calc(50% - 170px);
  flex-direction: column;
  width: 340px;
  background-color: #21004B;
  border: 10px solid #7000FF;
  color: #CCFF00;
  box-sizing: border-box;
}

@media only screen and (min-width: 500px) {
  .modal-content {
    top: 15%;
    left: calc(50% - 250px);
    width: 500px;
  }
}

@media only screen and (max-width: 500px) {
  .instructions h5 {
    font-size: 16px !important;
  }
}
</style>
