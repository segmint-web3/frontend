<template>
  <modal class="mint-successful-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex message-modal-content">
        <div class="instructions">
          <img class='done-icon' :src="`${publicPath}icons/lets-icons_done-duotone.svg`"/>
          <h2 class="primary-text">Mint is successful</h2>
          <div class='instructions-line'></div>
          <div class="socials-block">
            <div class="socials">
              <a href="https://x.com/segmintapp" target="_blank"><img :src="`${publicPath}icons/socials-x.svg`" alt="x"></a>
              <a href="https://discord.gg/P6dmQG9DuH" target="_blank"><img :src="`${publicPath}icons/socials-discord.svg`" alt="discord"></a>
              <a href="https://t.me/segmintapp" target="_blank"><img :src="`${publicPath}icons/socials-telegram.svg`" alt="telegram"></a>
            </div>
            <div class="secondary-text">Subscribe so you don't miss our future
              contests and airdrops</div>
          </div>
        </div>
        <button class="primary-button" v-on:click="this.close">
          Close
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
export default {
  name: 'KingRulesModal',
  data: function () {
    return {
      publicPath: process.env.BASE_URL,
    }
  },
  props: ['name'],
  computed: {},
  methods: {
    close() {
      this.$modal.hide(this.name);
    }
  }
}
</script>

<style scoped>
.primary-button {
  width: 180px;
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
  background-color: var(--window-bg);
  border: 4px solid var(--sunrise);
  color: var(--yellow);
  box-sizing: border-box;
  padding: 40px;
}

.socials {
  text-align: center;
}
.socials img {
  margin: 0 10px;
  width: 48px;
  height: 48px;
}

.message-modal-content {
  flex-direction: column;
  text-align: left;
}

.primary-text {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  margin: 0;
  text-align: center;
}
.secondary-text {
  font-size: 14px;
  font-weight: 500;
  margin: 20px 0;
  text-align: center;
}
.done-icon {
  width: 150px;
  height: 150px;
  margin: 20px auto;
  display: block;
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
