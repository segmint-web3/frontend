<template>
  <modal class="moderation-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex moderation-modal-content">
        <div class="instructions">
          {{ description }}
          <a :href='url' target='_blank' style='color: #FFED6CFF; display: block'>{{url}}</a>
        </div>
        <div class='buttons-container'>
          <button class="primary-button" v-on:click="this.ban">
            Ban
          </button>
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
  props: ['name', 'id'],
  computed: {
    description() {
      let mapping = this.$store.state.Provider.nftDataById;
      let nft = mapping[this.id];
      if (nft) {
        return nft.description || 'No description :-(';
      } else {
        return `Loading description for nft with id ${this.id}...`;
      }
    },
    url() {
      let mapping = this.$store.state.Provider.nftDataById;
      let nft = mapping[this.id];
      if (nft) {
        return nft.url || 'No url';
      } else {
        return `Loading url for nft with id ${this.id}...`;
      }
    }
  },
  methods: {
    close() {
      this.$modal.hide(this.name);
    },
    ban() {
      this.$store.dispatch('Provider/addToBanList', {id: this.$props.id});
      this.$modal.hide(this.name);
    },
    beforeOpen() {
      console.log('beforeOpen');
      this.$store.dispatch('Provider/fetchNftData', {id: this.$props.id});
    },
  },

}
</script>

<style scoped>
.moderation-modal {
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
.moderation-modal-content {
  flex-direction: column;
  padding: 20px;
}
.moderation-modal .buttons-container {
  display: block;
}
.moderation-modal .primary-button {
  margin: 10px;
}
.instructions {
  font-weight: 700;
  font-size: 18px;
  margin: 0 20px 20px;
  max-width: 300px;
  text-align: center;
  word-break: break-all;
  max-height: 500px;
  overflow: scroll;
}
</style>
