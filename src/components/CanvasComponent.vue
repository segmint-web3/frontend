<template>
  <div class="container" @mousedown.stop="clearSelectionIfNotInProgress">
    <div class="content">
      <ModerationModal name='moderation-modal' :id='moderationId' @close="closeModerationModal"/>
      <KingComponent :onclick='showKingRulesPopup'></KingComponent>
      <div class="canvas-container" @mouseup="onMouseUp" @mouseleave="onMouseLeave" @mousedown="onMouseDown" @mousemove="onMouseMove">
        <div class='canvas-stack'>
          <canvas class='main-canvas' ref="canvas" width="1000" height="1000"></canvas>
          <canvas :style='oldCanvasStyles' class='old-canvas' ref="canvasOld" width="1000" height="1000"></canvas>
          <div :style='highlightLastNft()'></div>
        </div>
        <div class="hover-popup" :style="highLightPopupStyles">
          {{highlightNftDescription}}
          <a v-if='isManager' :href='highlightNftLink' style='color: #FFED6CFF; display: block; word-break: break-all;' target='_blank'>
            {{highlightNftLink}}
          </a>
        </div>
        <div class="selection-header" :style="selectionHeaderStyle">
          {{ selectedWidth }}x{{selectedHeight}}
        </div>
        <div :style="selectionStyles"></div>
        <div v-for="tile in badTiles" v-bind:key="tile.index">
          <div :style="styleForBadTile(tile)" />
        </div>
        <br />
      </div>
      <button @mousedown.stop class="primary-button mint-button" v-if="this.selectionStartX !== null && !this.selectionInProcess && this.badTiles.length === 0" v-on:click="claim">
        Mint segment
      </button>
    </div>
    <FooterComponent></FooterComponent>
  </div>
</template>

<script>
import ModerationModal from '@/components/ModerationModal.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import { getMainBackgroundTileColor, getMainForegroundTileColor } from '@/utils/pixels'
import isMobile from 'ismobilejs';
import KingComponent from '@/components/KingComponent.vue'

// import zoomMixin from "@/mixins/zoom"

export default {
  name: 'CanvasComponent',
  components: { KingComponent, ModerationModal, FooterComponent},
  // mixins: [zoomMixin],
  props: ['isEditingMode', 'toggleEditingMode', 'openMint', 'openLink', 'showKingRulesPopup'],
  data() {
    return {
      ctx: null,
      ctxOld: null,
      imageData: null,
      // to claim the tiles
      selectionInProcess: false,
      selectionStartX: null,
      selectionStartY: null,
      selectionEndX: null,
      selectionEndY: null,
      // to show nftDescription
      highLightNftId: null,
      moderationId: null,
      lastMousePosX: 0,
      lastMousePosY: 0,
      selectionTriedCounter: 0,
      isMobile: isMobile(window.navigator).any,
    }
  },
  computed: {
    collectionLoaded: function() {
      return this.$store.state.Provider.collectionLoaded;
    },
    isManager: function() {
      return this.$store.state.Provider.account && this.$store.state.Provider.blockListManagers[this.$store.state.Provider.account];
    },
    hideOldCanvas: function() {
      return this.isEditingMode || this.selectionTriedCounter > 0 || this.selectionInProcess;
    },
    oldCanvasStyles: function() {
      if (this.hideOldCanvas) {
        return {}
      } else {
        return {
          visibility: 'visible',
          opacity: 1,
          transition: 'opacity 250ms ease-in, visibility 0ms ease-in 0ms'
        };
      }
    },
    badTiles: function() {
      if (this.selectionStartX === null || this.$store.state.Provider.setTileCounter < 0)
        return [];
      let sX = this.selectionStartX;
      let sY = this.selectionStartY;
      let endX = this.selectionEndX;
      let endY = this.selectionEndY;
      let tiles = this.$store.state.Provider.tilesByIndex;
      let badSelectedTiles = [];
      for (let x = sX; x <= endX; x += 20) {
        for (let y = sY; y <= endY; y += 20) {
          const index = (x/20)*50 + y/20;
          const tileInStore = tiles[index];
          if (tileInStore.epoch === this.$store.state.Provider.epoch && tileInStore.nftId !== '4294967295') {
            badSelectedTiles.push(tileInStore);
          }
        }
      }
      return badSelectedTiles;
    },
    selectedTilesCount: function () {
      if (this.selectionStartX === null || this.selectionStartY === null)
        return 0;
      return (this.selectionEndX - this.selectionStartX + 20) / 20 * (this.selectionEndY - this.selectionStartY + 20) / 20;
    },
    tiles: function() {
      return this.$store.state.Provider.tiles;
    },
    selectedWidth: function () {
      return this.selectionEndX - this.selectionStartX + 20
    },
    selectedHeight: function () {
      return this.selectionEndY - this.selectionStartY + 20
    },
    selectedPriceUSD: function () {
      return this.selectedWidth * this.selectedHeight * 1_000_000_000;
    },
    highLightPopupStyles: function() {
      // When we hover some nft, we show popup with text
      if (this.highLightNftId && !this.selectionInProcess) {
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
        return nft.description || 'No description :-(';
      } else {
        return `Loading description for nft with id ${this.highLightNftId}...`;
      }
    },
    highlightNftLink() {
      let mapping = this.$store.state.Provider.nftDataById;
      let nft = mapping[this.highLightNftId];
      if (nft) {
        return nft.url;
      } else {
        return ''
      }
    },
    selectionStyles: function () {
      // Style for dynamic selection
      if (this.selectionStartX !== null) {
        return {
          position: 'absolute',
          left: `${this.selectionStartX}px`,
          top: `${this.selectionStartY}px`,
          width: `${this.selectionEndX - this.selectionStartX + 20}px`,
          height: `${this.selectionEndY - this.selectionStartY + 20}px`,
          backgroundColor: 'rgba(255,237,108,0.5)'
        }
      }
      return {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        backgroundColor: 'rgba(255,237,108,0.5)'
      }
    },
    selectionHeaderStyle: function () {
      if (this.selectionStartX !== null) {
        if (this.selectionStartY > 100 ) {
          return {
            left: `${(this.selectionStartX + this.selectionEndX)/2 - 20}px`,
            top: `${this.selectionStartY - 25}px`
          }
          // Above selection
        } else {
          // Below selection
          return {
            left: `${(this.selectionStartX + this.selectionEndX)/2 - 20}px`,
            top: `${this.selectionEndY + 25}px`
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
        }
      }
    }
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    this.ctxOld = this.$refs.canvasOld.getContext('2d');
    this.imageData = this.ctx.createImageData(20, 20);
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'Provider/setCollection') {
        this.redraw(mutation.payload.tilesByIndex, this.$store.state.Provider.epoch);
      } else if (mutation.type === 'Provider/setTile') {
        this.drawTile(mutation.payload.tile, this.$store.state.Provider.epoch);
      } else if (mutation.type === 'Provider/setEpoch' || mutation.type === 'Provider/addBlockedNft') {
        // Epoch is changed, redraw everything
        if (this.$store.state.Provider.collectionLoaded) {
          setTimeout(() => {
            this.redraw(this.$store.state.Provider.tilesByIndex, mutation.payload.epoch || this.$store.state.Provider.epoch);
          }, 1);
        }
      } else if (mutation.type === 'Provider/makeFireShow') {
        let nft = this.$store.state.Provider.userNfts.find((nft) => nft.id === mutation.payload.id);
        // Make fireshow
        if (nft) {
          for (let i = 0; i < 25; i++) {
            setTimeout(() => {
              for (let tX = nft.tileStartX; tX < nft.tileEndX; tX++) {
                for (let tY = nft.tileStartY; tY < nft.tileEndY; tY++) {
                  let index = tX * 50 + tY;
                  if (this.$store.state.Provider.tilesByIndex[index].nftId === nft.id) {
                    this.drawTile({
                      x: tX * 20,
                      y: tY * 20,
                      pixels: i === 24 ? this.$store.state.Provider.tilesByIndex[index].pixels : (i % 2 === 0 ? getMainBackgroundTileColor() : getMainForegroundTileColor())
                    }, this.$store.state.Provider.epoch);
                  }
                }
              }
            }, i * 500);
          }
        }
      }
    })
  },
  methods: {
    onLinkOpen(url) {
      this.$props.openLink(url);
    },
    clearSelection() {
      this.selectionInProcess = false;
      this.selectionStartX = null;
      this.selectionStartY = null;
      this.selectionEndX = null;
      this.selectionEndY = null;
    },
    clearSelectionIfNotInProgress() {
      if (!this.selectionInProcess) {
        this.clearSelection();
        if (this.$props.isEditingMode) {
          this.$props.toggleEditingMode();
        }
      }
    },
    drawTile(tile, epoch) {
      this.imageData.data.set(tile.pixels);
      if (tile.epoch === epoch) {
        this.ctx.putImageData(this.imageData, tile.x, tile.y);
        this.ctxOld.clearRect(tile.x, tile.y, 20, 20);
      } else {
        this.ctxOld.putImageData(this.imageData, tile.x, tile.y);
      }
    },
    redraw(tiles, epoch) {
      // TODO do not redraw everything
      this.ctx.clearRect(0, 0, 1000, 1000);
      this.ctxOld.clearRect(0, 0, 1000, 1000);
      for (let key in tiles) {
        this.imageData.data.set(tiles[key].pixels);
        if (tiles[key].epoch === epoch) {
          this.ctx.putImageData(this.imageData, tiles[key].x, tiles[key].y);
        } else {
          this.ctxOld.putImageData(this.imageData, tiles[key].x, tiles[key].y);
        }
      }
    },
    highlightLastNft() {
      if (!this.$store.state.Provider.collectionLoaded || this.$store.state.Provider.lastNftId <= 0) {
        return {}
      }
      // console.log(this.$store.state.Provider.nftCoordsById[this.$store.state.Provider.lastNftId])
      let coords = this.$store.state.Provider.nftCoordsById[this.$store.state.Provider.lastNftId];
      if (!coords) {
        return {}
      }
      return {
        border: '3px solid black',
        position: 'absolute',
        left: `${coords.x - 3}px`,
        top: `${coords.y - 3}px`,
        width: `${coords.width}px`,
        height: `${coords.height}px`,
        'borderImage': `url("data:image/svg+xml;charset=utf-8,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cstyle%3Epath%7Banimation:stroke 2s infinite linear%3B%7D%40keyframes stroke%7Bto%7Bstroke-dashoffset:776%3B%7D%7D%3C/style%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff0000' /%3E%3Cstop offset='25%25' stop-color='%23c05c7e' /%3E%3Cstop offset='50%25' stop-color='%23f3826f' /%3E%3Cstop offset='100%25' stop-color='%23ffb961' /%3E%3C/linearGradient%3E %3Cpath d='M1.5 1.5 l97 0l0 97l-97 0 l0 -97' stroke-linecap='square' stroke='url(%23g)' stroke-width='3' stroke-dasharray='388'/%3E %3C/svg%3E") 1`
      }
    },
    styleForBadTile: function (tile) {
      // Style for one tile (20x20) in case
      // Selection overlaps already purchased tile
      return {
        position: 'absolute',
        left: `${tile.x}px`,
        top: `${tile.y}px`,
        width: `20px`,
        height: `20px`,
        backgroundColor: 'red'
      }
    },
    onMouseDown(event) {
      event && event.preventDefault();
      event && event.stopPropagation();
      if (!this.collectionLoaded)
        return;

      if (!this.$props.isEditingMode) {
        this.$props.toggleEditingMode();
      }

      if (this.isMobile && !this.isEditingMode) {
        // On mobile selection available only in editing mode;
        if (this.highLightNftId) {
          if (this.isManager) {
            this.showModerationPopup(this.highLightNftId);
          } else {
            let nft = this.$store.state.Provider.nftDataById[this.highLightNftId];
            if (nft && nft.url) {
              const urlPattern = /^(https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
              if (urlPattern.test(nft.url)) {
                this.onLinkOpen(nft.url);
              }
            }
          }
          return;
        }
      }

      // this is tricky to show empty tiles
      setTimeout(() => {
        if (this.selectionInProcess) {
          this.selectionTriedCounter += 1;
          setTimeout(() => {
            this.selectionTriedCounter -= 1;
          }, 1000);
        }
      }, 200);

      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      let xPos = Math.floor((event.clientX - canvasRect.left)/20)*20;
      let yPos = Math.floor((event.clientY - canvasRect.top)/20)*20;
      if (xPos < 0 || xPos > 990 || yPos < 0 || yPos > 990)
        return;

      if (this.selectionStartX !== null && this.selectionStartX === this.selectionEndX && this.selectionStartY === this.selectionEndY && !this.highLightNftId) {
          // we probably on mobile device and trying to select
        let prevState = {
          selectionStartX: this.selectionStartX,
          selectionStartY: this.selectionStartY,
          selectionEndX: this.selectionEndX,
          selectionEndY: this.selectionEndY
        }
        this.selectionStartX = Math.min(xPos, prevState.selectionStartX);
        this.selectionStartY = Math.min(yPos, prevState.selectionStartY);
        this.selectionEndX = Math.max(xPos, prevState.selectionEndX);
        this.selectionEndY = Math.max(yPos, prevState.selectionEndY);
        if (this.selectionEndX - this.selectionStartX > 160) {
          this.selectionEndX = this.selectionStartX + 160;
        }
        if (this.selectionEndY - this.selectionStartY > 160) {
          this.selectionEndY = this.selectionStartY + 160;
        }

        while ((this.selectionEndX - this.selectionStartX + 20) * (this.selectionEndY - this.selectionStartY + 20) > 16000) {
          // Funny random
          // Todo, think about better crop
          if (Math.random() > 0.5) {
            if (this.selectionEndX > this.selectionStartX) {
              this.selectionEndX -= 20;
            }
          } else {
            if (this.selectionEndY > this.selectionStartY) {
              this.selectionEndY -= 20;
            }
          }
        }
      } else {
        this.selectionInProcess = true;
        this.selectionStartX = xPos;
        this.selectionStartY = yPos;
        this.selectionEndX = xPos;
        this.selectionEndY = yPos;
      }
    },
    onMouseMove(event) {
      if (!this.collectionLoaded)
        return

      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      let coordX = event.clientX - canvasRect.left;
      let coordY = event.clientY - canvasRect.top;

      let xPos = Math.floor(coordX/20)*20;
      let yPos = Math.floor(coordY/20)*20;
      if (xPos < 0 || xPos > 990 || yPos < 0 || yPos > 990) {
        return;
      }

      if (!this.selectionInProcess) {
        // highlight popup logic
        this.lastMousePosX = coordX;
        this.lastMousePosY = coordY;
        const index = (xPos/20 * 50) + yPos/20;
        const tileInStore = this.$store.state.Provider.tilesByIndex[index];
        if (tileInStore && tileInStore.nftId !== '4294967295' && tileInStore.nftId !== this.highLightNftId && (!this.hideOldCanvas || tileInStore.epoch === this.$store.state.Provider.epoch)) {
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

      // Some tricky logic to keep max selected piece in range 0..12000 pixels
      if (xPos <= this.selectionEndX) {
        this.selectionEndX = Math.max(xPos, this.selectionStartX);
      } else {
        while (xPos > this.selectionEndX) {
          let newTilesCount = (this.selectionEndX - this.selectionStartX + 40) * (this.selectionEndY - this.selectionStartY + 20);
          if (newTilesCount <= 16000 && (this.selectionEndX - this.selectionStartX < 240)) {
            this.selectionEndX += 20
          } else {
            break;
          }
        }
      }
      if (yPos <= this.selectionEndY) {
        this.selectionEndY = Math.max(yPos, this.selectionStartY);
      } else {
        while (yPos > this.selectionEndY) {
          let newTilesCount = (this.selectionEndX - this.selectionStartX + 20) * (this.selectionEndY - this.selectionStartY + 40);
          if (newTilesCount <= 16000 && (this.selectionEndY - this.selectionStartY < 240)) {
            this.selectionEndY += 20;
          } else {
            break;
          }
        }
      }
    },
    onMouseUp() {
      if (!this.collectionLoaded)
        return
      this.selectionInProcess = false;
      if (this.selectionStartX !== null && this.selectionStartX === this.selectionEndX && this.selectionStartY === this.selectionEndY && this.highLightNftId) {
        let nft = this.$store.state.Provider.nftDataById[this.highLightNftId];
        if (this.isManager) {
          this.showModerationPopup(this.highLightNftId);
        } else {
          if (nft && nft.url) {
            const urlPattern = /^(https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
            if (urlPattern.test(nft.url)) {
              this.onLinkOpen(nft.url);
            }
          }
        }
      }
      if (this.badTiles.length > 0) {
        setTimeout(() => {
          this.clearSelection();
        }, 2000);
      }
    },
    onMouseLeave() {
      this.highLightNftId = null;
      if (this.selectionInProcess !== false) {
        this.onMouseUp();
      }
      // if (this.selectionInProcess) {
      //   this.clearSelection();
      // }
    },
    claim(e) {
      e && e.preventDefault();
      if (this.$store.state.Provider.account) {
        this.$props.openMint(this.selectedWidth, this.selectedHeight, this.selectionStartX, this.selectionStartY);
      } else {
        this.$store.dispatch('Provider/connect');
      }
    },
    showModerationPopup(id) {
      this.moderationId = id;
      this.$store.dispatch('Provider/fetchNftData', {id: this.moderationId});
      this.$modal.show('moderation-modal');
    },
    closeModerationModal() {
      this.$modal.hide('moderation-modal');
    },
    preventDefault(e) {
      console.log('prevent default');
      e && e.preventDefault();
      e && e.stopPropagation();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  font-family: "ChakraPetch", Helvetica, Arial;
  height: 100%;
  width: 100%;
  overflow: auto;
  background-color: rgba(49, 37, 122, 1);
  background-image: url('../../public/pattern.svg');
  background-repeat: repeat;
}
.content {
  flex: 1;
}
.canvas-container {
  margin: 10px auto 120px;
  position: relative;
  width: 1000px;
  height: 1000px;
  user-select: none;
  background-color: var(--midnight);
}

.main-canvas {
  user-select: none;
  box-sizing: border-box;
  background-image: repeating-linear-gradient(var(--sunrise) 0 1px, transparent 1px 100px), repeating-linear-gradient(90deg, var(--sunrise) 0 1px, transparent 1px 100px);
  background-size: 20px 20px;
  background-color: var(--dark-night);
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}

.old-canvas {
  user-select: none;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  margin: 0;
  padding: 0;
  opacity: 0.3;
  transition: opacity 250ms ease-in;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fadeOut {
  0% { opacity: 1%; }
  100% { opacity: 0; }
}


.mint-button {
  position: fixed;
  bottom: 120px;
  left: calc(50% - 80px);
  font-family: inherit;
  cursor: pointer;
  z-index: 2;
}
@media only screen and (max-width: 600px) {
  .mint-button {
    bottom: 200px;
  }
}

.hover-popup {
  color: var(--yellow);
  position: absolute;
  font-weight: bold;
  padding: 10px;
  background-color: var(--midnight);
  overflow-x: hidden;
}

.selection-header {
  position: absolute;
  width: 60px;
  height: 20px;
  background-color: var(--yellow);
  color: var(--dark-night);
  text-align: center;
}
</style>
