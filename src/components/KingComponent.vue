<template>
  <div class="king-wrapper" >
    <div class="content" v-if='isKingLoaded' @click='this.$props.onclick'>
      <div v-if='isKingGameInProgress'>
        <img :src='`${publicPath}king_icon.svg`' class='crown-icon'/>
        <div class='title'>King of Segmint</div>
      </div>
      <div v-if='isKingGameInProgress' class='two-columns title-wrapper'>
        <div class='left-side'>
          <div class="sub-title">Jackpot Prize:</div>
          <div class="sub-title">Current king:</div>
          <div class="sub-title">Time Left:</div>
        </div>
        <div class='right-side'>
          <div class="sub-title bold">{{this.pot}} VENOM</div>
          <div><a :href='this.kingVenomScan' class="sub-title" target='_blank'>{{ currentKingAddress === connectedAccount ? "You're the leader!" : currentKingAddress.slice(0, 5) + ' . . . ' + currentKingAddress.slice(61) }}</a></div>
          <div class="sub-title time">{{countDown}}</div>
        </div>
      </div>
      <div v-if='!isKingGameInProgress' class="title-wrapper">
<!--        <img :src='`${publicPath}king_icon.svg`' class='crown-icon'/>-->
<!--        <div class='title'>King of Segmint</div>-->
        <div class='left-side'>
          <div class='title'>King of Segmint</div>
        </div>
        <div class='right-side'>
          <div class='title'>&nbsp;Game finished</div>
        </div>
      </div>
      <div v-if='!isKingGameInProgress' class='two-columns'>
        <div class='left-side'>
          <div class="sub-title">Jackpot Prize:</div>
          <div class="sub-title">Winner:</div>
          <div class="sub-title">Next game:</div>
        </div>
        <div class='right-side'>
          <div class="sub-title bold">{{this.winningAmount}} VENOM</div>
          <div><a :href='this.kingVenomScan' class="sub-title" target='_blank'>{{ currentKingAddress === connectedAccount ? "You're the winner!" : currentKingAddress.slice(0, 5) + ' . . . ' + currentKingAddress.slice(61) }}</a></div>
          <div class="sub-title">Starting soon!</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import moment from 'moment'

const KingGameStatusEnum = {
  WaitingForStart: "0",
  RoundInProgress: "1",
  WaitingForClosing: "2",
  Finished: "3"
};

export default {
  name: 'KingComponent',
  props: ['onclick'],
  data() {
    return {
      timer: null,
      currentTime: 0,
      publicPath: process.env.BASE_URL,
    }
  },
  mounted() {
    this.currentTime = Math.floor(Date.now()/1000);
    var lastFinishTry = 0;
    this.timer = window.setInterval(() => {
      this.currentTime = Math.floor(Date.now()/1000);
      if (this.$store.state.Provider.king.status === KingGameStatusEnum.RoundInProgress && this.currentTime > this.$store.state.Provider.king.endTime) {
        if (Date.now() - 1000 * 30 > lastFinishTry) {
          lastFinishTry = Date.now();
          this.$store.dispatch('Provider/kingFinishRound');
        }
      }
    }, 300);
  },
  unmounted() {
    clearInterval(this.timer);
    this.timer = null;
  },
  computed: {
    isKingLoaded: function() {
      console.log('isKingLoaded')
      console.log(this.$store.state.Provider.king)
      return !!this.$store.state.Provider.king.kingContract;
    },
    isKingGameInProgress: function() {
      return this.$store.state.Provider.king.status !== KingGameStatusEnum.Finished;
    },
    isKingGameFinished: function() {
      return this.$store.state.Provider.king.kingContract === KingGameStatusEnum.Finished;
    },
    kingRound: function() {
      return this.$store.state.Provider.king.currentRound;
    },
    currentKingAddress: function() {
      // return this.$store.state.Provider.account ? this.$store.state.Provider.account.toString().slice(0, -1) + '9' : this.$store.state.Provider.king.currentKing;
      return this.$store.state.Provider.king.currentKing;
    },
    connectedAccount: function() {
      return this.$store.state.Provider.account && this.$store.state.Provider.account.toString();
    },
    kingVenomScan: function() {
      return `https://venomscan.com/accounts/${this.$store.state.Provider.king.currentKing}`;
    },
    pot: function() {
      return this.$store.state.Provider.king.currentPot;
    },
    winningAmount: function() {
      return this.$store.state.Provider.king.winningAmount;
    },
    countDown() {
      if (this.$store.state.Provider.king.endTime === 0)
        return 'Waiting for start';

      if (this.currentTime > this.$store.state.Provider.king.endTime) {
        return 'Waiting for finish';
      } else {
        return moment
          .unix(this.$store.state.Provider.king.endTime - this.currentTime)
          .utc()
          .format('HH[h] mm[m] ss[s]')
      }
    }
  }
}
</script>

<style scoped>
.king-wrapper {
  margin-top: 100px;
  position: sticky;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--yellow);
  user-select: none;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--dark);
  padding: 20px 50px;
  cursor: pointer;
  border-radius: 20px;
  background: linear-gradient(262deg, #34277E 0%, #5C48D2 100%);
}
.content:hover {
  border: 2px solid var(--yellow);
}
.title {
  font-size: 22px;
  min-width: 140px;
  margin-bottom: 10px;
  margin-left: 10px;
  display: inline-block;
  line-height: 22px;
  vertical-align: text-bottom;
}
.two-columns {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.title-wrapper {
  margin-bottom: 10px;
}
@media only screen and (max-width: 768px) {
  .mobile-one-column {
    flex-direction: column;
  }
  .mobile-hidden {
    display: none;
  }
}
.left-side {
  text-align: right;
  margin-right: 20px;
}

.sub-title {
  font-size: 18px;
  color: var(--yellow);
  line-height: 22px;
}
.time {
  min-width: 100px;
}
.crown-icon {
  display: inline-block;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}
</style>
