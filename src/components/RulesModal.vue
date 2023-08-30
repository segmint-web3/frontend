<template>
  <modal class="rules-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex message-modal-content">
        <div class="instructions">
          <h2 class="primary-text">How it works</h2>
          <ul class="list">
            <li>
              <p class='secondary-text'>Pick an area to take a seat on the board</p>
            </li>
            <li>
              <p class='secondary-text'>Each time the board fills up, a new season begins</p>
            </li>
            <li>
              <p class='secondary-text'>Each season increases the price per pixel</p>
            </li>
            <li>
              <p class='secondary-text'>You can burn your NFT if it has been painted over completely and get your tokens back</p>
            </li>
          </ul>
          <div class='instructions-warning'>
            <img :src="`${publicPath}icons/warning.svg`" alt="link">
            <h4 class='instructions-warning-text'>
              Your nft can be locked in case of inappropriate content
            </h4>
          </div>
          <div class='instructions-line'></div>
        </div>
        <button class="primary-button" v-on:click="this.close">
          OK
        </button>
        <div class='season'>
          <h2 class='primary-text'>Season {{this.season}}</h2>
          <p class='secondary-text'>1 pixel per {{ this.price }} VENOM</p>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
export default {
  name: 'RulesModal',
  data: function () {
    return {
      publicPath: process.env.BASE_URL,
    }
  },
  props: ['name'],
  computed: {
    season: function() {
      return this.$store.state.Provider.epoch;
    },
    price: function() {
      return (parseInt(this.$store.state.Provider.currentTilePrice) / 400 / 1_000_000_000).toFixed(4)
    }
  },
  methods: {
    close() {
      this.$modal.hide(this.name);
    }
  },

}
</script>

<style scoped>
.primary-button {
  width: 133px;
  font-family: 'ChakraPetch';
  font-style: normal;
  font-weight: 700;
  font-size: 24px;
  line-height: 30px;
}

.modal-content {
  position: fixed;
  top: 5%;
  left: calc(50% - 225px);
  flex-direction: column;
  width: 450px;
  max-height: 95%;
  overflow-y: scroll;
  background-color: var(--dark-night);
  border: 10px solid var(--sunrise);
  color: var(--yellow);
  box-sizing: border-box;
  padding: 40px;
}


.message-modal-content {
  flex-direction: column;
  text-align: left;
}

.instructions-title {
  font-size: 32px;
  line-height: 38px;
  margin: 0 0 24px 0;
  font-weight: 600;
}
.list {
  list-style-type:square;
}
.modal-content ul {
  padding-inline-start: 16px;
}

.modal-content li p {
  margin: 24px 0;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.instructions-warning {
  display: flex;
  margin: 24px 5px;
}
.instructions-warning img {
  margin-right: 11px;
}
.instructions-warning-text {
  font-family: 'ChakraPetch';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 16px;
  color: var(--yellow);
  margin: 0;
}
.instructions-line {
  margin: 24px 0;
  width: 100%;
  height: 1px;
  background-color: var(--yellow);
  opacity: 0.5;
}
.season {
 margin-top: 24px;
 text-align: center;
}

.primary-text {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  margin: 0;
}
.secondary-text {
  font-size: 24px;
  line-height: 30px;
  font-weight: 500;
  margin: 0;
}

@media only screen and (max-width: 500px) {
  .modal-content {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    flex: 1;
    justify-content: center;
    padding: 10px;
  }
  .primary-text {
    font-size: 28px;
    line-height: 34px;
    font-weight: 600;
    margin: 0;
  }
  .secondary-text {
    font-size: 18px;
    line-height: 24px;
    font-weight: 500;
    margin: 0;
  }
}

</style>
