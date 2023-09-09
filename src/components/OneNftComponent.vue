<template>
  <div class="nft-container">
    <div :style="canvasStyles" class="canvas-container">
      <a v-if='$props.collectionName === $store.state.Provider.page' :href="scanLink" target='_blank'>
        <canvas :style="canvasStyles" ref="canvas" :width="this.width" :height="this.height"></canvas>
      </a>
      <a v-else :href="scanLink" target='_blank'>
        <img width='100%' height='100%' :src='`${publicPath}collection_banner_${$props.collectionName}.png`' />
      </a>
    </div>
    <div class='nft-info-container'>
      <div class='nft-info-title'>
        <a :href='$props.url' target='_blank' :title="this.$props.description">
          {{this.$props.description}}
        </a>
      </div>
    </div>
    <div class="nft-buttons" v-show='isFromShowedCollection'>
      <div class='secondary-button nft-info-button' @click='edit'>
        <span>
          Edit
        </span>
        <img :src="`${publicPath}icons/edit.svg`" alt="edit" class="edit-icon">
      </div>
      <div class='secondary-button nft-info-button' @click='burn'>
        <span>
          Burn
        </span>
        <img :src="`${publicPath}icons/burn.svg`" alt="burn" class="burn-icon">
      </div>
    </div>
    <div class="nft-buttons" v-show='!isFromShowedCollection'>
      <div class='secondary-button nft-info-button' @click='goToNftPage'>
        <span>
          Go to {{this.collectionNameBeauty}} collection
        </span>
        <img :src="`${publicPath}icons/open_page.svg`" alt="open" class="open-icon">
      </div>
    </div>
    <div class='nft-subinfo-container'>
      <p v-show='isFromShowedCollection'>
        {{ this.visiblyText }}
      </p>
      <p v-show='!isFromShowedCollection'>
        This NFT is from {{this.collectionNameBeauty}} collection
      </p>
      <p>
        Locked value: {{this.beautyValue}} Venom
      </p>
    </div>
  </div>
</template>

<script>
import { getMainForegroundTileColor } from '@/utils/pixels'

export default {
  name: 'OneNft',
  data () {
    return {
      publicPath: process.env.BASE_URL
    }
  },
  props: ['id', 'collectionName', 'address', 'tileStartX', 'tileStartY', 'tileEndX', 'tileEndY', 'description', 'url', 'onedit', 'lockedAmount', 'onError'],
  computed: {
    x: function() {
      return this.$props.tileStartX * 20;
    },
    y: function() {
      return this.$props.tileStartY * 20;
    },
    width: function() {
      return (this.$props.tileEndX - this.$props.tileStartX) * 20;
    },
    height: function() {
      return (this.$props.tileEndY - this.$props.tileStartY) * 20;
    },
    isFromShowedCollection() {
      return this.$props.collectionName === this.$store.state.Provider.page;
    },
    collectionNameBeauty() {
      return this.$props.collectionName.slice(0, 1).toUpperCase() + this.$props.collectionName.slice(1);
    },
    canvasStyles: function () {
      if (this.isFromShowedCollection) {
        const height = 250/this.width * this.height;
        return {
          margin: 'auto',
          width: `100%`,
          height: `${height}px`
        }
      } else {
        return {
          margin: 'auto',
          width: `100%`,
          height: `100%`
        }
      }
    },
    scanLink: function() {
      return `https://testnet.venomscan.com/accounts/${this.$props.address.toString()}`;
    },
    beautyValue: function() {
      return (parseInt(this.$props.lockedAmount)/1_000_000_000).toFixed(2)
    },
    visiblyText: function () {
      if (this.isFullyVisible) {
        return `This segment is fully visible.`;
      } else if (this.isPartialVisible) {
        return `This segment is partially visible.`;
      } else {
        return `This segment can be burn.`;
      }
    },
    isFullyVisible: function() {
      let fullyVisible = true;
      for (let x = this.$props.tileStartX; x < this.$props.tileEndX; x ++) {
        for (let y = this.$props.tileStartY; y < this.$props.tileEndY; y ++) {
          const index = x * 50 + y;
          if (this.$store.state.Provider.tilesByIndex[index].nftId !== this.$props.id) {
            fullyVisible = false;
            break;
          }
        }
        if (!fullyVisible)
          break;
      }
      return fullyVisible;
    },
    isPartialVisible: function() {
      let isPartialVisible = false;
      for (let x = this.$props.tileStartX; x < this.$props.tileEndX; x ++) {
        for (let y = this.$props.tileStartY; y < this.$props.tileEndY; y ++) {
          const index = x * 50 + y;
          if (this.$store.state.Provider.tilesByIndex[index].nftId === this.$props.id) {
            isPartialVisible = true;
            break;
          }
        }
        if (isPartialVisible)
          break;
      }
      return isPartialVisible;
    }
  },
  mounted() {
    if (this.isFromShowedCollection) {
      this.redraw();
    }
  },
  methods: {
    goToNftPage() {
      this.$store.dispatch('Provider/changePage', {newPage: this.$props.collectionName});
    },
    edit() {
      if (this.isPartialVisible) {
        this.$props.onedit(this.$props.id, this.x, this.y, this.width, this.height);
      } else {
        this.onError(`Your nft was completely covered by new NFTs and become invisible. You can burn it to get locked value back.`);
      }
    },
    burn() {
      if (this.isFullyVisible) {
        this.$store.commit('Provider/makeFireShow', {id: this.$props.id})
        this.onError(`Your NFT can only be burned if it is completely covered by new NFTs.`);
      } else if (this.isPartialVisible) {
        this.$store.commit('Provider/makeFireShow', {id: this.$props.id})
        this.onError(`Your NFT can only be burned if it is completely covered by new NFTs. Now it is partially visible.`);
      } else {
        this.$store.dispatch('Provider/burnNft', this.$props.id).catch((err) => {
          console.log(err);
          if (err.code !== 3) {
            this.onError(err.message);
          }
        });
      }
    },
    floorPrice() {
      return this.width * this.height
    },
    redraw() {
      const ctx = this.$refs.canvas.getContext('2d');
      const imageData = ctx.createImageData(20, 20);
      for (let x = this.$props.tileStartX; x < this.$props.tileEndX; x ++) {
        for (let y = this.$props.tileStartY; y < this.$props.tileEndY; y ++) {
          const index = x * 50 + y;
          const tileInStore = this.$store.state.Provider.tilesByIndex[index];
          if (tileInStore && tileInStore.nftId  === this.$props.id) {
            imageData.data.set(tileInStore.pixels);
            ctx.putImageData(imageData, (x - this.$props.tileStartX)*20, (y - this.$props.tileStartY)*20);
          } else {
            imageData.data.set(getMainForegroundTileColor());
            ctx.putImageData(imageData, (x - this.$props.tileStartX)*20, (y - this.$props.tileStartY)*20);
          }
        }
      }
    },
  }
}
</script>

<style scoped>
.nft-container {
  width: 254px;
  border: solid 2px var(--sunrise);
  padding-bottom: 10px;
}
.canvas-container {
  width: 100%;
  border-bottom: solid 2px var(--sunrise);
  margin-bottom: 3px;
}

.canvas-container img {
  margin-bottom: -5px;
}

canvas {
  image-rendering: pixelated;
}

.nft-info-container {
  width: 100%;
  display: flex;
}

.nft-buttons {
  display: flex;
  flex-direction: row;
  padding: 0 10px;
}

.nft-info-title {
  width: 100%;
  padding: 5px 10px;
  flex: 1;
  text-align: left;
}

.nft-info-title a {
  color: var(--yellow) !important;
  font-family: "ChakraPetch", Helvetica, Arial;
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 36px;
  text-decoration: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 90%;
  display: block;
}

.nft-info-title a:hover {
  text-decoration: underline;
}

.nft-info-button {
  border: solid 2px var(--yellow);
  cursor: pointer;
  height: 28px;
  padding: 0px 5px;
  margin-right: 5px;
}
.nft-info-button span {
  color: var(--yellow) !important;
  font-family: "ChakraPetch", Helvetica, Arial;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
}
.nft-info-button .edit-icon {
  margin-left: 5px;
}
.nft-info-button .burn-icon {
  width: 15px;
  height: 15px;
  margin-left: 5px;
}
.nft-info-button .open-icon {
  margin-left: 5px;
}
.nft-subinfo-container {
  text-align: left;
  font-family: "ChakraPetch", Helvetica, Arial;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  margin: 0px 10px;
}
.nft-subinfo-container p {
  margin: 5px 0;
}
</style>
