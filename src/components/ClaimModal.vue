<template>
  <modal class="claim-modal" :name="$props.name" height="auto" @before-close="beforeClose" @before-open='beforeOpen'>
    <div class="flex modal-content">
      <div v-if="claimInProgress" style="background-color: rgba(0, 0, 0, 0.3); position: absolute; left: 0; right: 0; top:0; bottom: 0;"></div>
      <div class="instructions">
          Please upload a picture {{this.width}}x{{this.height}}px.
      </div>
      <label for="assetsFieldHandle" class="file-upload">
        <input type="file" multiple name="fields[assetsFieldHandle][]" class="file-input" id="assetsFieldHandle"
             @change="onChange" ref="file" accept=".pdf,.jpg,.jpeg,.png" />
        <button class="transparent-button">Select Image</button>
      </label>
      <div :style="canvasContainerStyles" class="canvasContainer">
        <canvas :style="canvasContainerStyles" ref="canvas" :width="this.$props.width" :height="this.$props.height"></canvas>
      </div>
      <form>
        <div class="flex title">
          <label for="title">Title:</label>
          <input v-model="title" type="text" id="title" class="input">
        </div>
        <div class="flex link">
          <label for="link">Link:</label>
          <input v-model="link" type="text" id="link" class="input">
        </div>
        <button v-if="canBeClaimed" class="primary-button" v-on:click="claim">
          {{$props.id ? 'Edit segment' : 'Mint segment'}}
        </button>
      </form>
      <div v-if='claimInProgress' class="claim-in-progress">
        <span>{{$props.id ? 'Edit in progress' : 'Claim in progress'}}</span>
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
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
      claimInProgress: false,
      title: '',
      link: ''
    }
  },
  props: ['id', 'name', 'x', 'y', 'width', 'height', 'onsuccess'],
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

      ctx.fillStyle = 'black';
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
    claim(event) {
      event.preventDefault();
      if (this.claimInProgress)
        return

      // TODO show alert if description/title is longer then 2000 symbols.
      const description = this.title.trim().slice(0, 2000);
      const url = this.link.trim().slice(0, 2000);

      let promise;
      if (this.$props.id) {
        promise = this.$store.dispatch('Provider/redrawNft', {id: this.$props.id, x: this.$props.x, y: this.$props.y, width: this.$props.width, height: this.$props.height, tiles: this.coloredTiles, description, url});
      } else {
        promise = this.$store.dispatch('Provider/claimTiles', {x: this.$props.x, y: this.$props.y, width: this.$props.width, height: this.$props.height, tiles: this.coloredTiles, description, url});
      }
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
    },
    beforeOpen() {
      this.title = '';
      this.link = '';
      this.coloredTiles = [];
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
  top: 15%;
  left: calc(50% - 166px);
  flex-direction: column;
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
form {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}
form label {
  width: 60px;
}
form button {
  width: 200px;
  align-self: center;
}
.title, .link {
  margin-bottom: 10px;
}
.claim-in-progress {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #21004B;
  color: var(--primary);
  font-weight: 700;
  display: flex;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  align-items: center;
  font-size: 40px;
}
.claim-in-progress span {
  display: block;
  width: 100%;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid var(--primary);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--primary) transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
