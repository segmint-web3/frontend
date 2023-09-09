<template>
  <modal class="link-warning-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex link-warning-modal-content">
        <div class="instructions">
          <br />
          <h2 style='margin: 0'>Please be aware!</h2>
          <br />
          The link provided below is intended for those who have minted NFT and <b>NOT</b> associated with SegMint or Venom Foundation.
          <br /><br />
          Exercise caution when accessing it, and please note that we do not assume any responsibility for its content or any potential risks associated with it.
          <br />
          <br />
          <a :href='$props.url' target='_blank' style='color: #FFED6CFF; display: block'>{{$props.url}}</a>
        </div>
        <div class='buttons-container'>
          <button class="primary-button" v-on:click="this.close">
            Close
          </button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
export default {
  name: 'ModerationModal',
  data: function () {
    return {}
  },
  props: ['name', 'url'],
  computed: {},
  methods: {
    close() {
      this.$modal.hide(this.name);
    },
  },
}
</script>

<style scoped>
.link-warning-modal {
  background-color: rgb(255 237 108 / 50%);
  z-index: 9;
}
.modal-content {
  position: fixed;
  top: 10%;
  left: calc(50% - 160px);
  flex-direction: column;
  min-width: 300px;
  box-sizing: border-box;
  width: 320px;
  background-color: var(--dark-night);
  border: 10px solid var(--sunrise);
  color: var(--yellow);
}
@media only screen and (max-width: 500px) {
  .modal-content {
    top: 0;
    bottom: 0;
  }
  .instrutions {
    font-size: 16px !important;
    line-height: 16px !important;
  }
}
.link-warning-modal-content {
  flex-direction: column;
  padding: 5px;
}
.link-warning-modal .buttons-container {
  display: block;
}
.link-warning-modal .primary-button {
  margin: 10px;
}
.instructions {
  display: block;
  font-weight: 700;
  font-size: 18px;
  margin: 0 10px 10px;
  max-width: 300px;
  text-align: center;
  word-break: break-word;
  max-height: 500px;
}
</style>
