<template>
  <modal class="claim-modal" :name="$props.name" height="auto" @before-close="beforeClose" @before-open='beforeOpen'>
    <div class="flex modal-content">
      <div class="claim-modal-header">
        {{ headerText }}
        <img :src="`${publicPath}icons/close.svg`" alt="close" class="close" @click="$emit('close')">
      </div>
      <div class=" flex claim-modal-content">
        <div v-if="claimInProgress" style="background-color: rgba(0, 0, 0, 0.3); position: absolute; left: 0; right: 0; top:0; bottom: 0;"></div>
        <div v-if="!canBeClaimed" class="instructions">
            Please upload a picture {{this.width}}x{{this.height}}px.
        </div>
        <div v-else class="instructions">
            You have selected a {{this.width}}x{{this.height}}px segment
        </div>
        <label for="assetsFieldHandle" class="file-upload">
          <input type="file" multiple name="fields[assetsFieldHandle][]" class="file-input" id="assetsFieldHandle"
              @change="onChange" ref="file" accept=".pdf,.jpg,.jpeg,.png" />
          <button class="transparent-button">Select Image</button>
        </label>
        <div v-show="canBeClaimed" :style="canvasContainerStyles" class="canvasContainer">
          <canvas :style="canvasContainerStyles" ref="canvas" :width="this.$props.width" :height="this.$props.height"></canvas>
        </div>
        <form v-if="canBeClaimed">
          <div class="flex description">
            <label for="description">Title:</label>
            <input v-model="description" type="text" id="description" class="input" maxlength="1000">
          </div>
          <div class="flex link">
            <label for="link">Link:</label>
            <input v-model="link" type="text" id="link" class="input" maxlength="1000" @input="inputLink($event)">
          </div>
          <div v-if="!linkValid" class="error">Link format is not correct</div>
          <button class="primary-button" v-on:click="claim">
            {{$props.id ? 'Edit segment' : `Mint for $${this.width * this.height}`}}
          </button>
        </form>
        <div v-if='claimInProgress' class="claim-in-progress">
          <span>{{$props.id ? 'Edit in progress' : 'Claim in progress'}}</span>
          <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
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
      description: '',
      link: '',
      publicPath: process.env.BASE_URL,
      linkValid: true
    }
  },
  props: ['id', 'name', 'x', 'y', 'width', 'height', 'onsuccess', 'onclose'],
  computed: {
    canBeClaimed: function() {
      return this.coloredTiles.length > 0;
    },
    canvasContainerStyles: function () {
      if (this.$props.width > 60 || this.$props.height > 60) {
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
    headerText(){
      if (this.canBeClaimed) {
        if (this.$props.id)
          return 'Editing';
        return "Minting";
      } else return "Choosing a picture";
    }
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

      const description = this.description;
      const url = this.link;
      const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
      if(urlPattern.test(url)) {
        this.linkValid = true;
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
          }).catch((err) => {
            console.log(err);
            this.claimInProgress = false;
          })
        }
      } else {
        this.linkValid = false;
      }
    },
    beforeClose(event) {
      if (this.claimInProgress)
        event.cancel();
    },
    beforeOpen() {
      this.description = '';
      this.link = '';
      this.coloredTiles = [];
    },
    inputLink(){
      this.linkValid = true;
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
.claim-modal-header {
  width: 100%;
  padding: 0 10px 10px 10px;
  text-align: center;
  background: #7000FF;
  color: var(--primary);
  font-family: "ChakraPetch", Helvetica, Arial;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}
.claim-modal-header img.close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.modal-content {
  position: fixed;
  top: 15%;
  left: calc(50% - 166px);
  flex-direction: column;
  min-width: 300px;
  background-color: #21004B;
  border: 10px solid #7000FF;
  color: #CCFF00;
}
.claim-modal-content {
  flex-direction: column;
  padding: 20px;
}
.instructions {
  font-weight: 700;
  margin: 0 20px 20px;
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
  margin-top: 20px;
}
.description, .link {
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

.error {
  color: red;
}
</style>
