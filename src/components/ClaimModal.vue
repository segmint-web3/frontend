<template>
  <modal class="claim-modal" name="claim-modal" height="auto" @before-close="beforeClose">
    <div class="modal-content">
      <div v-if="claimInProgress" style="background-color: rgba(0, 0, 0, 0.3); position: absolute; left: 0; right: 0; top:0; bottom: 0;"></div>
      <div class="instructions">
          Please upload a picture {{this.width}}x{{this.height}}px.
          You will can change the picture later.
      </div>
      <label for="assetsFieldHandle" class="file-upload">
      <input type="file" multiple name="fields[assetsFieldHandle][]" class="file-input" id="assetsFieldHandle"
             @change="onChange" ref="file" accept=".pdf,.jpg,.jpeg,.png" />
        <button class="transparent-button">Select Image</button>
      </label>
      <div :style="canvasContainerStyles" class="canvasContainer">
        <canvas :style="canvasContainerStyles" ref="canvas" :width="this.$props.width" :height="this.$props.height"></canvas>
      </div>
      <button v-if="canBeClaimed" class="primary-button" v-on:click="claim">
        Claim tiles
      </button>
    </div>
  </modal>
</template>

<script>
import {encodePixelsToTileColor} from "@/utils/pixels";

export default {
  name: 'ClaimModal',
  data: function () {
    return {
      coloredTiles: [],
      claimInProgress: false
    }
  },
  props: ['x', 'y', 'width', 'height', 'onsuccess'],
  computed: {
    canBeClaimed: function() {
      return this.coloredTiles.length > 0;
    },
    canvasContainerStyles: function () {
      if (this.$props.width > 100 || this.$props.height > 100) {
        return {
          margin: 'auto',
          width: `${this.$props.width * 2}px`,
          height: `${this.$props.height * 2}px`
        }
      }
      return {
        margin: 'auto',
        width: `${this.$props.width * 4}px`,
        height: `${this.$props.height * 4}px`
      }
    },
  },
  methods: {
    onChange() {
      // todo parse image
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const img = new Image;
      const width = this.$props.width;
      const height = this.$props.height;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      this.coloredTiles = [];
      const tiles = [];
      img.onload = function() {
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight;
        if (width / height > aspectRatio) {
          drawHeight = height;
          drawWidth = drawHeight * aspectRatio;
        } else {
          drawWidth = width;
          drawHeight = drawWidth / aspectRatio;
        }
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // encode image to array of tiles
        for (let tileY = 0; tileY < height/10; tileY++) {
          for (let tileX = 0; tileX < width/10; tileX++) {
              const data = ctx.getImageData(tileX*10, tileY*10, 10, 10);
              tiles.push(encodePixelsToTileColor(data.data))
          }
        }
        this.coloredTiles = tiles;
      }.bind(this)
      img.src = URL.createObjectURL(this.$refs.file.files[0]);
    },
    claim() {
      if (this.claimInProgress)
        return

      // TODO add inputs to specify descriptions nad urls
      const description = 'Test description';
      const url = 'https://google.com';

      const promise = this.$store.dispatch('Provider/claimTiles', {x: this.$props.x, y: this.$props.y, width: this.$props.width, height: this.$props.height, tiles: this.coloredTiles, description, url});
      if (promise) {
        this.claimInProgress = true;
        promise.then(() => {
          this.claimInProgress = false;
          this.$props.onsuccess();
        }).catch(() => {
          this.claimInProgress = false;
        })
      }
    },
    beforeClose(event) {
      if (this.claimInProgress)
        event.cancel();
    }
  }
}
</script>

<style scoped>
.canvasContainer {
 margin-top: 10px !important;
}
canvas {
  image-rendering: pixelated;
}

.claim-modal {
  background-color: rgb(59 0 135 / 50%);
}
.modal-content {
  position: fixed;
  top: 10%;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
  min-width: 300px; 
  padding: 20px;
  background-color: #21004B;
  border: 10px solid #7000FF;
  color: #CCFF00;
}

.instructions {
  margin: 20px;
}
.file-upload {
  position: relative;
  cursor: pointer;
}
.file-upload button {
  pointer-events: none;
}
.file-input {
  visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
