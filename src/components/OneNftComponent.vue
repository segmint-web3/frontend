<template>
  <div class="nft-container">
    <div :style="canvasStyles" class="canvas-container">
      <a :href="scanLink" target='_blank'>
        <canvas :style="canvasStyles" ref="canvas" :width="this.$props.width" :height="this.$props.height"></canvas>
      </a>
    </div>
    <div class='nft-info-container'>
      <div class='nft-info-title'>
        <a :href='$props.url' target='_blank'>
          {{this.$props.description}}
        </a>
      </div>
      <div class='secondary-button nft-info-button' @click='edit'>
        <span>
          Edit
        </span>
        <img :src="`${publicPath}icons/edit.svg`" alt="edit" class="edit-icon">
      </div>
    </div>
    <div class='nft-subinfo-container'>
      <p>
        Segment size: {{this.$props.width}}x{{this.$props.height}}
      </p>
      <p>
          Floor price: {{this.floorPrice()}}$
      </p>
    </div>
  </div>
</template>

<script>

export default {
  name: 'OneNft',
  data () {
    return {
      publicPath: process.env.BASE_URL
    }
  },
  props: ['id', 'address', 'x', 'y', 'width', 'height', 'description', 'url', 'onedit'],
  computed: {
    canvasStyles: function () {
      const height = 250/this.$props.width * this.$props.height;
      return {
        margin: 'auto',
        width: `100%`,
        height: `${height}px`
      }
    },
    scanLink: function() {
      return `https://testnet.everscan.io/accounts/${this.$props.address.toString()}`;
    }
  },
  mounted() {
    this.redraw();
  },
  methods: {
    edit() {
      this.$props.onedit(this.$props.id, this.$props.x, this.$props.y, this.$props.width, this.$props.height);
    },
    floorPrice() {
      return this.$props.width * this.$props.height
    },
    redraw() {
      const ctx = this.$refs.canvas.getContext('2d');
      const imageData = ctx.createImageData(10, 10);
      for (let x = this.$props.x; x < this.$props.x + this.$props.width; x += 10) {
        for (let y = this.$props.y; y < this.$props.y + this.$props.height; y += 10) {
          const index = x * 10 + y/10;
          const tileInStore = this.$store.state.Provider.tilesByIndex[index];
          if (tileInStore) {
            imageData.data.set(tileInStore.pixels);
            ctx.putImageData(imageData, x - this.$props.x, y - this.$props.y);
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
  border: solid 2px #7000FF;
  padding-bottom: 10px;
}
.canvas-container {
  width: 100%;
  border-bottom: solid 2px #7000FF;
}
canvas {
  image-rendering: pixelated;
}

.nft-info-container {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.nft-info-title {
  padding: 5px 10px;
}

.nft-info-title a {
  color: var(--primary) !important;
  font-family: "ChakraPetch", Helvetica, Arial;
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 36px;
  text-decoration: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 160px;
  display: block;
}

.nft-info-title a:hover {
  text-decoration: underline;
}

.nft-info-button {
  border: solid 2px var(--primary);
  cursor: pointer;
  height: 22px;
  padding: 0px 5px;
  margin-right: 5px;
}
.nft-info-button span {
  color: var(--primary) !important;
  font-family: "ChakraPetch", Helvetica, Arial;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
}
.nft-info-button .edit-icon {
  margin-left: 10px;
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
