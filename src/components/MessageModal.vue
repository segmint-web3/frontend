<template>
  <modal class="message-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex message-modal-content">
        <div class="instructions">
          {{$props.message}}
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
  name: 'MessageModal',
  data: function () {
    return {}
  },
  props: ['name', 'message'],
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
  background-color: rgb(255 237 108 / 50%);
  z-index: 9;
}
.modal-content {
  position: fixed;
  top: 10%;
  left: calc(50% - 166px);
  flex-direction: column;
  min-width: 300px;
  background-color: var(--dark-night);
  border: 10px solid var(--sunrise);
  color: var(--yellow);
}
.message-modal-content {
  flex-direction: column;
  padding: 20px;
}
.instructions {
  font-weight: 700;
  font-size: 24px;
  margin: 0 20px 20px;
  max-width: 300px;
  text-align: center;
}
</style>
