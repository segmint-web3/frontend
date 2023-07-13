<template>
  <div class="wrapper">
    <claim-modal name='claim-modal' :width="selectedWidth" :height="selectedHeight" :x="selectionStartX" :y="selectionStartY" :onsuccess="onClaimModalSuccess" @close="closeClaimModal"/>
    <mint-tokens-modal name='mint-tokens-modal' :amount="selectedPriceUSD" :onsuccess="onMintTokenModalSuccess" @close="closeMintTokensModal"/>
    <div class="canvas-container" @click="click" @mouseup="onMouseUp" @mouseleave="onMouseLeave" @mousedown="onMouseDown" @mousemove="onMouseMove">
      <div :style="selectionHeaderStyle">
        {{ selectedWidth }}x{{selectedHeight}}
      </div>
      <div :style="selectionStyles"></div>
      <div v-for="tile in badTiles" v-bind:key="tile.index">
        <div v-if="selectedTilesCount > badTiles.length" :style="styleForBadTile(tile)" />
      </div>
      <div class="hover-popup" :style="highLightPopupStyles">
        {{highlightNftDescription}}
      </div>
    <!-- <panZoom ref="panZoom" :options="zoomOptions" @init="onInit"> -->
      <canvas ref="canvas" width="1000" height="1000"></canvas>
    <!-- </panZoom> -->
      <br />
    </div>
    <button class="primary-button mint-button" v-if="this.selectionStartX !== null && !this.selectionInProcess" v-on:click="claim">
      <!-- SegMint pixels {{this.selectionEndX - this.selectionStartX + 10}}x{{this.selectionEndY - this.selectionStartY + 10}} -->
      Mint segment
    </button>
  </div>
</template>

<script>
import ClaimModal from "@/components/ClaimModal.vue";
import MintTokensModal from '@/components/MintTokensModal.vue';
// import { fabric } from "fabric";

export default {
  name: 'CanvasComponent',
  components: {ClaimModal, MintTokensModal},
  props: {},
  data() {
    return {
      ctx: null,
      imageData: null,
      isMobile: false,
      collectionLoaded: false,
      // to claim the tiles
      selectionInProcess: false,
      selectionStartX: null,
      selectionStartY: null,
      selectionEndX: null,
      selectionEndY: null,
      // to show nftDescription
      highLightNftId: null,
      lastMousePosX: 0,
      lastMousePosY: 0,
      zoom: {scale: 1, x: 0, y: 0},
      scale: 1
    }
  },
  computed: {
    badTiles: function() {
      // return []
      if (this.selectionStartX === null)
        return [];
      let sX = this.selectionStartX;
      let sY = this.selectionStartY;
      let endX = this.selectionEndX;
      let endY = this.selectionEndY;
      let badSelectedTiles = [];
      for (let x = sX; x <= endX; x += 10) {
        for (let y = sY; y <= endY; y += 10) {
          const index = Math.round(x * 10 + y/10);
          const tileInStore = this.$store.state.Provider.tilesByIndex[index];
          console.log(this.$store.state.Provider, 'index', index, Math.round(index))
          if (tileInStore.nftId !== '4294967295') {
            badSelectedTiles.push(tileInStore);
          }
        }
      }
      return badSelectedTiles;
    },
    selectedTilesCount: function () {
      if (this.selectionStartX === null || this.selectionStartY === null)
        return 0;
      return (this.selectionEndX - this.selectionStartX + 10) / 10 * (this.selectionEndY - this.selectionStartY + 10) / 10;
    },
    tiles: function() {
      return this.$store.state.Provider.tiles;
    },
    selectedWidth: function () {
      return this.selectionEndX - this.selectionStartX + 10
    },
    selectedHeight: function () {
      return this.selectionEndY - this.selectionStartY + 10
    },
    selectedPriceUSD: function () {
      return this.selectedWidth * this.selectedHeight * 1_000_000_000;
    },
    highLightPopupStyles: function() {
      // When we hover some nft, we show popup with text
      if (this.highLightNftId) {
        const left = this.lastMousePosX > 600;
        return {
          top: `${this.lastMousePosY}px`,
          left: `${left ? this.lastMousePosX - 235 : this.lastMousePosX + 15}px`,
          width: '200px',
          minHeight: '20px'
        }
      } else {
        return {
          display: 'none'
        }
      }
    },
    highlightNftDescription() {
      let mapping = this.$store.state.Provider.nftDataById;
      let nft = mapping[this.highLightNftId];
      if (nft) {
        return nft.description;
      }
      return '';
    },
    selectionStyles: function () {
      // Style for dynamic selection
      if (this.selectionStartX !== null && this.selectedTilesCount > this.badTiles.length) {
        return {
          position: 'absolute',
          left: `${this.selectionStartX+this.zoom.x}px`,
          top: `${this.selectionStartY+this.zoom.y}px`,
          width: `${this.selectionEndX - this.selectionStartX + 10}px`,
          height: `${this.selectionEndY - this.selectionStartY + 10}px`,
          backgroundColor: 'rgba(204,255,0,0.5)',
          'z-index': 10
        }
      }
      return {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        backgroundColor: 'rgba(204,255,0,0.5)',
        'z-index': 10
      }
    },
    selectionHeaderStyle: function () {
      if (this.selectionStartX !== null && this.selectedTilesCount > this.badTiles.length) {
        if (this.selectionStartY+this.zoom.y > 100 ) {
          return {
            position: 'absolute',
            left: `${(this.selectionStartX + this.selectionEndX + this.zoom.x)/2 - 30}px`,
            top: `${this.selectionStartY+this.zoom.y - 25}px`,
            width: `60px`,
            height: `20px`,
            borderRadius: '5px',
            backgroundColor: 'yellow',
            textAlign: 'center',
            'z-index': 10
          }
          // Above selection
        } else {
          // Below selection
          return {
            position: 'absolute',
            left: `${(this.selectionStartX + this.selectionEndX + this.zoom.x)/2 - 30}px`,
            top: `${this.selectionEndY + this.zoom.y + 15}px`,
            width: `60px`,
            height: `20px`,
            borderRadius: '5px',
            backgroundColor: 'yellow',
            textAlign: 'center',
            'z-index': 10
          }
        }
      } else {
        return {
          display: 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          backgroundColor: 'rgba(204,255,0,0.5)',
          'z-index': 10
        }
      }
    },
    zoomOptions(){
      return {
          minZoom: 0.8, 
          maxZoom: 1.5,
          bounds: true, 
          boundsPadding: 0.1,
          boundsDisabledForZoom: false,
          beforeMouseDown: function(e) {
            let shouldIgnore = !e.altKey;
            return shouldIgnore;
          }
        }
    }
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    // this.ctx = new fabric.Canvas(this.$refs.canvas);
    this.imageData = this.ctx.createImageData(10*this.zoom.scale, 10*this.zoom.scale);
    // if (this.$store.state.Provider.tiles.length > 0) {
    //   this.redraw(this.$store.state.Provider.tiles);
    // }
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'Provider/setTiles') {
        this.redraw(mutation.payload.tiles);
      } else if (mutation.type === 'Provider/setTile') {
        this.drawTile(mutation.payload.tile);
      }
    })
    this.$refs.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      this.scale += delta * 0.1;
      console.log(this.scale, 'wheel', event)
      // this.ctx.scale(this.scale, this.scale);
      this.ctx.setTransform(this.scale, 1, 2, this.scale, 2, 10);
    });
  },
  methods: {
    // onInit: function(panzoomInstance) {
    //   panzoomInstance.on('zoom', (e) => {
    //     this.zoom = e.getTransform();
    //     console.log(e, this.zoom, e.getTransform());
    //   });
      // panzoomInstance.on('mousemove', (e) => {
      //   let matirx = this.$refs.panZoom.$panZoomInstance.getTransformMatrix();
      //   let parentOffset = this.$refs.canvas.getBoundingClientRect();

      //   let temp = {};
      //   temp.x = (e.pageX - parentOffset.left) / matirx.scale;
      //   temp.y = (e.pageY - parentOffset.top) / matirx.scale;
      //   //console.log("S: " + matirx.scale + ", tX: " + matirx.transX + ", tY: " + matirx.transY + ", pX: " + e.pageX + ", pY: " + e.pageY + ", left: " + parentOffset.left + ", top: " + parentOffset.top);
      //   return temp;
      // });
    // },
    clearSelection() {
      this.selectionInProcess = false;
      this.selectionStartX = null;
      this.selectionStartY = null;
      this.selectionEndX = null;
      this.selectionEndY = null;
    },
    drawTile(tile) {
      this.imageData.data.set(tile.pixels)
      this.ctx.putImageData(this.imageData, tile.x, tile.y);
    },
    redraw(tiles) {
      // TODO do not redraw everything
      for (let tile of tiles) {
        this.imageData.data.set(tile.pixels)
        this.ctx.putImageData(this.imageData, tile.x, tile.y);
      }
      this.collectionLoaded = true;
    },
    styleForBadTile: function (tile) {
      // Style for one tile (10x10) in case
      // Selection overlaps already purchased tile
      return {
        position: 'absolute',
        left: `${tile.x}px`,
        top: `${tile.y}px`,
        width: `${10*this.zoom.scale}px`,
        height: `${10*this.zoom.scale}px`,
        backgroundColor: 'red'
      }
    },
    onMouseDown(event) {
       if (this.isMobile || !this.collectionLoaded)
        return;
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      let xPos = Math.floor((event.clientX - canvasRect.left)/10*this.zoom.scale)*10*this.zoom.scale;
      let yPos = Math.floor((event.clientY - canvasRect.top)/10*this.zoom.scale)*10*this.zoom.scale;
      // console.log(this.$refs.panZoom.$panZoomInstance.getTransform(), 'transform', canvasRect, 'rect', xPos, 'x', yPos, 'y')
      if (xPos < 0 || xPos > 990 * this.zoom.scale || yPos < 0 || yPos > 990 * this.zoom.scale)
        return;
      this.selectionInProcess = true;
      this.selectionStartX = xPos;
      this.selectionStartY = yPos;
      this.selectionEndX = xPos;
      this.selectionEndY = yPos;
    },
    onMouseMove(event) {
      if (this.isMobile || !this.collectionLoaded)
        return

      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      let coordX = event.clientX - canvasRect.left;
      let coordY = event.clientY - canvasRect.top;

      let xPos = Math.floor(coordX/10)*10;
      let yPos = Math.floor(coordY/10)*10;
      if (xPos < 0 || xPos > 990 || yPos < 0 || yPos > 990) {
        return;
      }

      if (!this.selectionInProcess) {
        // highlight popup logic
        this.lastMousePosX = coordX;
        this.lastMousePosY = coordY;
        const index = Math.round(xPos * 10 + yPos/10);
        const tileInStore = this.$store.state.Provider.tilesByIndex[index];
        if (tileInStore && tileInStore.nftId !== '4294967295' && tileInStore.nftId !== this.highLightNftId) {
          this.highLightNftId = tileInStore.nftId;
          setTimeout(() => {
            if (this.highLightNftId === tileInStore.nftId) {
              this.$store.dispatch('Provider/fetchNftData', {id: tileInStore.nftId});
            }
          }, 1000);
        } else if(tileInStore.nftId !== this.highLightNftId) {
          this.highLightNftId = null;
        }
        return;
      }

      // Some tricky logic to keep max selected piece in range 0..10000 pixels
      if (xPos <= this.selectionEndX){
        this.selectionEndX = Math.max(xPos, this.selectionStartX);
      } else {
        while (xPos > this.selectionEndX) {
          let newTilesCount = (this.selectionEndX - this.selectionStartX + 20) * (this.selectionEndY - this.selectionStartY + 10);
          if (newTilesCount <= 10000) {
            this.selectionEndX += 10
          } else {
            break;
          }
        }
      }
      if (yPos <= this.selectionEndY) {
        this.selectionEndY = Math.max(yPos, this.selectionStartY);
      } else {
        while (yPos > this.selectionEndY) {
          let newTilesCount = (this.selectionEndX - this.selectionStartX + 10) * (this.selectionEndY - this.selectionStartY + 20);
          if (newTilesCount <= 10000) {
            this.selectionEndY += 10;
          } else {
            break;
          }
        }
      }
    },
    onMouseUp() {
      if (this.isMobile || !this.collectionLoaded)
        return
      this.selectionInProcess = false;
      if (this.selectionStartX !== null && this.selectionStartX === this.selectionEndX && this.selectionStartY === this.selectionEndY && this.highLightNftId) {

        let nft = this.$store.state.Provider.nftDataById[this.highLightNftId];
        if (nft && nft.url) {
          setTimeout(() => {
            window.open(nft.url, '_blank');
          })
        }
      }
      if (this.badTiles.length > 0) {
        this.clearSelection();
      }
    },
    onMouseLeave() {
      if (this.isMobile)
        return
      if (this.selectionInProcess) {
        this.clearSelection();
      }
      this.highLightNftId = null;
    },
    click(event) {
      // Need to test on mobile
      if (!this.isMobile || !this.collectionLoaded) {
        return;
      }
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      //Logic to select the tiles to claim.
      console.log(canvasRect, 'canvasRect', event.clientX, 'x', event.clientY, 'y')
      let xPos = event.clientX - canvasRect.left;
      let yPos = event.clientY - canvasRect.top;

      let tileX = Math.floor(xPos / 10) * 10;
      let tileY = Math.floor(yPos / 10) * 10;

      if (this.selectionStartX !== null && this.selectionStartX === this.selectionEndX && this.selectionStartY === this.selectionEndY) {
        let prevState = {
          selectionStartX: this.selectionStartX,
          selectionStartY: this.selectionStartY,
          selectionEndX: this.selectionEndX,
          selectionEndY: this.selectionEndY
        }
        this.selectionStartX = Math.min(tileX, prevState.selectionStartX);
        this.selectionStartY = Math.min(tileY, prevState.selectionStartY);
        this.selectionEndX = Math.max(tileX, prevState.selectionEndX);
        this.selectionEndY = Math.max(tileY, prevState.selectionEndY);
      } else {
        this.selectionStartX = tileX;
        this.selectionStartY = tileY;
        this.selectionEndX = tileX;
        this.selectionEndY = tileY;
      }

      // Maximum one time claim is 100 tiles - 10000 pixels
      // So crop big selections
      while ((this.selectionEndX - this.selectionStartX + 10) * (this.selectionEndY - this.selectionStartY + 10) > 10000) {
        // Funny random
        // Todo, think about better crop
        if (Math.random() > 0.5) {
          if (this.selectionEndX > this.selectionStartX) {
            this.selectionEndX -= 10;
          }
        } else {
          if (this.selectionEndY > this.selectionStartY) {
            this.selectionEndY -= 10;
          }
        }
      }

      // Check is there is no empty tiles in selection
      const notEmptyTilesInSelection = this.tiles.filter(t =>
          t.nftId !== '4294967295' &&
          t.x >= this.selectionStartX &&
          t.y >= this.selectionStartY &&
          t.x <= this.selectionEndX &&
          t.y <= this.selectionEndY
      )

      // todo smart crop if there are busy tiles
      // for (let busyTile of notEmptyTilesInSelection) {
      //   if (this.selectionStartX <= busyTile.x)
      //     this.selectionStartX = busyTile.x + 10;
      //   if (this.selectionStartY <= busyTile.y)
      //     this.selectionStartY = busyTile.y + 10;
      //
      //   if (this.selectionEndX >= busyTile.x)
      //     this.selectionEndX = busyTile.x - 10;
      //   if (this.selectionEndY <= busyTile.x)
      //     this.selectionEndY = busyTile.y - 10;
      // }

      // Cancel selection
      if (notEmptyTilesInSelection.length !== 0) {
        // TODO show toast notification
        // TILES ARE NOT EMPTY
        this.selectionStartX = null;
        this.selectionStartY = null;
        this.selectionEndX = null;
        this.selectionEndY = null;
      }
    },
    claim() {
      if (this.$store.state.Provider.account) {
        if (this.selectedPriceUSD > this.$store.state.Provider.tokenWalletBalance) {
          this.$modal.show('mint-tokens-modal');
        } else {
          console.log('open-modal')
          this.$modal.show('claim-modal');
        }
      } else {
        this.$store.dispatch('Provider/connect');
      }
    },
    onClaimModalSuccess() {
      this.clearSelection();
      this.$modal.hide('claim-modal');
    },
    closeClaimModal(){
      console.log('closeClaimModal');
      this.$modal.hide('claim-modal');
    },
    onMintTokenModalSuccess() {
      this.$modal.hide('mint-tokens-modal');
      this.$modal.show('claim-modal');
    },
    closeMintTokensModal(){
      this.$modal.hide('mint-tokens-modal');
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  font-family: "ChakraPetch", Helvetica, Arial;
}
.canvas-container {
  margin: 100px auto 50px;
  position: relative;
  width: 1000px;
  height: 1000px;
  user-select: none;
}

canvas {
  user-select: none;
  width: 1000px;
  height: 1000px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-image: repeating-linear-gradient(#7000FF 0 1px, transparent 1px 100px), repeating-linear-gradient(90deg, #7000FF 0 1px, transparent 1px 100px);
  background-size: 10px 10px;
  background-color: #21004B;
}

.mint-button {
  position: fixed;
  bottom: 20px;
  left: calc(50% - 80px);
  font-family: inherit;
  cursor: pointer;
  z-index: 2;
}

.hover-popup {
  color: white;
  position: absolute;
  font-weight: bold;
  padding: 10px;
  background-color: rgba(0,0,0,0.8);
}
</style>
