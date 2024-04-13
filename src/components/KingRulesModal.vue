<template>
  <modal class="message-modal" :name="$props.name" height="auto">
    <div class="flex modal-content">
      <div class=" flex message-modal-content">
        <div class="instructions">
          <h2 class="primary-text">King of Segmint Rules</h2>
          <br />
<!--          <p class='secondary-text'>King of Segmint is a game for stimulating community engagement.</p>-->
          <ul class="list">
            <li>
              <p class='secondary-text'>The last person who mint a segment becomes the king.</p>
            </li>
            <li>
              <p class='secondary-text'>After that if no one mint a segment for 5 minutes current king win the game and the prize.</p>
            </li>
            <li>
              <p class='secondary-text'>After each mint, the timer resets to the beginning.</p>
            </li>
          </ul>
          <div class='instructions-warning'>
            <h4 class='instructions-warning-text'>
              King of Segmint is a game for stimulating community engagement. The amount of time you need to remain king can change during the game, so keep an eye on announcements in social media.
            </h4>
          </div>
          <div class='instructions-line'></div>
        </div>
        <button class="primary-button" v-on:click="this.onMint">
          Mint Segment
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
export default {
  name: 'KingRulesModal',
  data: function () {
    return {}
  },
  props: ['name', 'onMint'],
  computed: {},
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
