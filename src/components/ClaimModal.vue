<template>
  <modal class="mint-modal" :name="$props.name" height="auto" @before-close="beforeClose" @before-open='beforeOpen'>
    <div class="flex modal-content">
      <div class="mint-modal-header">
        {{ headerText }}
        <img :src="`${publicPath}icons/close.svg`" alt="close" class="close" @click="$emit('close')">
      </div>
      <div class="flex mint-modal-content">
        <div v-if="claimInProgress" style="background-color: rgba(0, 0, 0, 0.3); position: absolute; left: 0; right: 0; top:0; bottom: 0;"></div>
        <div v-if='!$props.id' v-show='!hideOnInputMobile' class="instructions">
          You have selected a {{this.width}}x{{this.height}} segment
        </div>
        <div v-if='!$props.id' v-show='!hideOnInputMobile' class="price">
           {{`Price ${this.mintingPrice} VENOM`}}
        </div>
        <div v-if='!$props.id' v-show='!hideOnInputMobile' class="fee">
          + our fee ≈0.09 VENOM
        </div>
        <div v-if="!canBeClaimed && $props.id" v-show='!hideOnInputMobile' class="instructions">
          Please upload a picture {{this.width}}x{{this.height}}px.
        </div>
        <label v-show='!hideOnInputMobile' for="assetsFieldHandle" class="file-upload">
          <input type="file" multiple name="fields[assetsFieldHandle][]" class="file-input" id="assetsFieldHandle"
                 @change="onChange" ref="file" accept=".jpg,.jpeg,.png" />
          <button class="transparent-button">Select Image</button>
        </label>
        <div v-show="showCanvas && !hideOnInputMobile" :style="canvasContainerStyles" class="canvasContainer">
          <canvas :style="canvasContainerStyles" ref="canvas" :width="this.$props.width" :height="this.$props.height"></canvas>
        </div>
        <div v-show="canBeClaimed && !hideOnInputMobile" class='slider'>
          <label :class="{selected: resizeMode === 'cover'}" @click='setResizeMode("cover")'>
            <div>Cover</div>
          </label>
          <label :class="{selected: resizeMode === 'contain'}" @click='setResizeMode("contain")'>
            <div>Contain</div>
          </label>
          <label :class="{selected: resizeMode === 'fill'}" @click='setResizeMode("fill")'>
            <div>Fill</div>
          </label>
        </div>
        <form v-if="canBeClaimed">
          <div class="flex description">
            <img :src="`${publicPath}icons/title.svg`" alt="title">
            <label for="description">Title:</label>
            <input @focus='onFocus' @blur='onBlur' v-model="description" type="text" id="description" class="input" maxlength="1000" autocorrect="off" autocapitalize="off">
          </div>
          <div class="flex link">
            <img :src="`${publicPath}icons/link.svg`" alt="link">
            <label for="link">Link:</label>
            <input @focus='onFocus' @blur='onBlur' v-model="link" type="text" id="link" class="input" maxlength="1000" @input="inputLink($event)" autocorrect="off" autocapitalize="off">
          </div>
          <div v-if="!linkValid" class="error">Link format is not correct</div>
          <button class="primary-button" v-on:click="claim">
            {{$props.id ? 'Edit segment' : `Mint segment`}}
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
import { encodePixelsToTileColor } from '@/utils/pixels'
import Blitz from 'blitz-resize';
import isMobile from 'ismobilejs';

export default {
  name: 'ClaimModal',
  data: function () {
    return {
      image: null,
      resizeMode: 'cover',
      coloredTiles: [],
      claimInProgress: false,
      description: '',
      link: '',
      publicPath: process.env.BASE_URL,
      linkValid: true,
      isMobile: isMobile(window.navigator).any,
      hideOnInputMobile: false
    }
  },
  props: ['id', 'name', 'x', 'y', 'width', 'height', 'onsuccess', 'onerror', 'onclose'],
  computed: {
    canBeClaimed: function() {
      return this.image !== null;
    },
    showCanvas: function() {
      return this.image !== null;
    },
    canvasContainerStyles: function () {
      if ((window.innerHeight < 610 && this.$props.height > 100) || (window.innerHeight < 520 && this.$props.height > 50)) {
        return {
          margin: 'auto',
          width: `${Math.floor(this.$props.width/2)}px`,
          height: `${Math.floor(this.$props.height/2)}px`
        }
      } else if (this.$props.width > 200 || this.$props.height > 200 || window.innerHeight < 690) {
        return {
          margin: 'auto',
          width: `${this.$props.width}px`,
          height: `${this.$props.height}px`
        }
      } else if (this.$props.width > 60 || this.$props.height > 60) {
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
    headerText()  {
      if (this.canBeClaimed) {
        if (this.$props.id)
          return 'Editing';
        return "Minting";
      } else return "Choosing a picture";
    },
    mintingPrice() {
      return (parseInt(this.$store.state.Provider.currentTilePrice) * (this.$props.width * this.$props.height / 400) / 1_000_000_000).toFixed(1);
    }
  },
  mounted() {
    console.log('CLAIM MODAL MOUNTED');
  },
  methods: {
    onFocus() {
      if (this.isMobile)
        this.hideOnInputMobile = true;
    },
    onBlur() {
      this.hideOnInputMobile = false;
    },
    setResizeMode(mode) {
      this.resizeMode = mode;
      this.redraw();
    },
    redraw(retry_num) {
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const width = this.$props.width;
      const height = this.$props.height;
      const tiles = [];
      const blitz = Blitz.create();

      let params;
      if (this.resizeMode === 'contain') {
        const imageAspectRatio = this.image.width / this.image.height;
        const canvasAspectRatio = width / height;
        let drawWidth, drawHeight;
        if (imageAspectRatio > canvasAspectRatio) {
          drawWidth = width;
          drawHeight = width / imageAspectRatio;
        } else {
          // Отношение сторон изображения меньше или равно отношению сторон холста (узкое изображение)
          drawWidth = height * imageAspectRatio;
          drawHeight = height;
        }
        params = {
          source: this.image,
          width: Math.floor(drawWidth),
          height: Math.floor(drawHeight),
          output: 'image',
          quality: 1
        }
      } else if (this.resizeMode === 'cover') {
        const aspectRatio = this.image.width / this.image.height;
        const canvasAspectRatio = width / height;
        if (canvasAspectRatio < aspectRatio) {
          params = {
            source: this.image,
            width: Math.floor(height * aspectRatio),
            height: height,
            proportional: true,
            output: 'image',
            quality: 1
          }
        } else {
          params = {
            source: this.image,
            width: width,
            height: Math.floor(width / aspectRatio),
            proportional: true,
            output: 'image',
            quality: 1
          }
        }
      } else {
        params = {
          source: this.image,
          width:  width,
          height: height,
          proportional: false,
          output: 'image',
          quality: 1
        }
      }
      blitz(params).then((img) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        if (img.width === 0 || img.height === 0) {
          // triky for iOS
          if (!retry_num || retry_num < 10) {
            setTimeout(() => {
              this.redraw((retry_num || 1) + 1);
            }, 50);
          }
        } else {
          // tricky for chrome....
          if (!retry_num || retry_num < 3) {
            setTimeout(() => {
              this.redraw((retry_num || 1) + 1);
            }, 50);
          }
        }
        if (this.resizeMode === 'contain') {
          const x = (width - img.width) / 2;
          const y = (height - img.height) / 2;
          ctx.drawImage(img, x, y, img.width, img.height);
        } else if (this.resizeMode === 'cover') {
          if (img.width > width) {
            ctx.drawImage(img, -1 * Math.floor((img.width - width)/2), 0, img.width, img.height);
          } else {
            ctx.drawImage(img, 0, -1 * Math.floor((img.height - height)/2), img.width, img.height);
          }
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        // encode image to array of tiles
        for (let tileX = 0; tileX < width/20; tileX++) {
          for (let tileY = 0; tileY < height/20; tileY++) {
            const data = ctx.getImageData(tileX*20, tileY*20, 20, 20);
            tiles.push(encodePixelsToTileColor(data.data))
          }
        }
        this.coloredTiles = tiles;
      })
    },
    onChange() {
      const img = new Image;
      img.onload = function() {
        this.image = img;
        setTimeout(() => {
          this.redraw();
        }, 100)
      }.bind(this)
      img.src = URL.createObjectURL(this.$refs.file.files[0]);
    },
    claim(event) {
      event.preventDefault();
      if (this.claimInProgress)
        return

      const description = this.description;
      let url = this.link;
      if (!url) {
        url = 'https://google.com/'
      }
      const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
      if(!urlPattern.test(url.trim().toLowerCase()) || (url.length > 0 && url.trim().split(' ').length === 1 && url.indexOf('.') !== -1)) {
        this.linkValid = true;
        let promise;
        if (this.$props.id) {
          promise = this.$store.dispatch('Provider/redrawNft', {id: this.$props.id,  tiles: this.coloredTiles, description, url: url.trim()});
        } else {
          promise = this.$store.dispatch('Provider/claimTiles', {tileStartX: this.$props.x/20, tileStartY: this.$props.y/20, tileEndX: (this.$props.x + this.$props.width)/20, tileEndY: (this.$props.y + this.$props.height)/20, tiles: this.coloredTiles, description, url: url.trim()});
        }

        if (promise) {
          this.claimInProgress = true;
          promise.then(() => {
            this.claimInProgress = false;
            this.$props.onsuccess();
          }).catch((err) => {
            this.claimInProgress = false;
            console.log('on error', err);
            if (!this.$props.id && err.code !== 3) {
              this.onerror(err.message);
            } else {
              this.redraw();
            }
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
      console.log('beforeOpen');
      this.description = '';
      this.link = '';
      this.coloredTiles = [];
      this.image = null;
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

.mint-modal {
  background-color: rgb(255 237 108 / 50%);
}
.mint-modal-header {
  width: 100%;
  padding: 0 10px 10px 10px;
  text-align: center;
  background: var(--sunrise);
  color: var(--yellow);
  font-family: "ChakraPetch", Helvetica, Arial;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}
.mint-modal-header img.close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.modal-content {
  position: fixed;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  flex-direction: column;
  background-color: var(--dark-night);
  border: 10px solid var(--sunrise);
  color: var(--yellow);
  box-sizing: border-box;
}

@media only screen and (min-width: 500px) {
  .modal-content {
    top: 5%;
    left: calc(50% - 150px);
    min-width: 300px;
    min-height: 300px;
    border: 10px solid var(--sunrise);
  }
}

.mint-modal-content {
  flex-direction: column;
  flex: 1;
  justify-content: center;
  padding: 20px;
}
.instructions {
  font-weight: 700;
  margin: 5px 0;
}

.price {
  margin-top: 8px;
  margin-bottom: 3px;
}
.fee {
  font-size: 14px;
  margin-bottom: 10px;
}
.file-upload {
  margin: 10px;
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
.input {
  min-width: 200px;
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
  background-color: var(--dark-night);
  color: var(--yellow);
  font-weight: 700;
  display: flex;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  align-items: center;
}
.claim-in-progress span {
  display: block;
  font-size: 30px;
  width: 100%;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 60px;
  height: 60px;
  margin-top: 20px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 44px;
  height: 44px;
  margin: 8px;
  border: 8px solid var(--yellow);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: var(--yellow) transparent transparent transparent;
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

.slider {
  width:100%;
  margin-top: 10px;
  box-sizing:border-box;
  text-align:center;
  position:relative;
  border-radius:2px;
}

.slider::after {
  content:"";
  display:block;
  clear:both;
}

.slider label {
  float:left;
  color: var(--yellow);
  background: transparent;
  width: calc(33.333% - 1px);
  position:relative;
  padding: 10px 0px 10px;
  overflow:hidden;
  transition:color 0.3s;
  cursor:pointer;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
  border: 2px solid var(--yellow);
  box-sizing: border-box;
}

.slider label input {
  position:absolute;
  top:-200%;
}

.slider label.selected {
  color: var(--midnight);
  background: var(--yellow);
}

</style>
