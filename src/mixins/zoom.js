// let canvas = document.getElementById("canvas")
// let ctx = this.$refs.canvas.getContext('2d')

// let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }
// let cameraZoom = 1
// let MAX_ZOOM = 5
// let MIN_ZOOM = 0.1
// let SCROLL_SENSITIVITY = 0.0005
export default {
  data(){
    return {
      cameraOffset: null,
      cameraZoom: 1,
      MAX_ZOOM: 5,
      MIN_ZOOM: 0.1,
      SCROLL_SENSITIVITY: 0.0005,
      isDragging: false,
      dragStart:{ x: 0, y: 0 },
      initialPinchDistance: null,
      lastZoom: 1,
    }
  },
  mounted(){
    this.ctx = this.$refs.canvas.getContext('2d');
    this.cameraOffset = { x: this.$refs.canvas.width/2, y: this.$refs.canvas.height/2 };
    this.lastZoom = this.cameraZoom;
    this.$refs.canvas.addEventListener('mousedown', this.onPointerDown);
    this.$refs.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, this.onPointerDown));
    this.$refs.canvas.addEventListener('mouseup', this.onPointerUp);
    this.$refs.canvas.addEventListener('touchend',  (e) => this.handleTouch(e, this.onPointerUp));
    this.$refs.canvas.addEventListener('mousemove', this.onPointerMove);
    this.$refs.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, this.onPointerMove));
    this.$refs.canvas.addEventListener( 'wheel', (e) => this.adjustZoom(e.deltaY*this.SCROLL_SENSITIVITY));

    this.draw();
  },
  methods: {
    draw() {
      let width = this.$refs.canvas.width;
      let height = this.$refs.canvas.height;
      this.ctx.translate(width / 2, height / 2);
      this.ctx.scale(this.cameraZoom, this.cameraZoom);
      this.ctx.translate(-width / 2 + this.cameraOffset.x, -height / 2 + this.cameraOffset.y);
      this.ctx.clearRect(0,0, width, height);
      
      // this.ctx.fillStyle = "#fff"
      // this.drawText("Simple Pan and Zoom Canvas", -255, -100, 32, "courier")
      
      requestAnimationFrame(this.draw)
  },

  // Gets the relevant location from a mouse or single touch event
  getEventLocation(e) {
      if (e.touches && e.touches.length == 1) {
          return { x:e.touches[0].clientX, y: e.touches[0].clientY }
      }
      else if (e.clientX && e.clientY) {
          return { x: e.clientX, y: e.clientY }        
      }
  },
  // drawText(text, x, y, size, font){
  //   this.ctx.font = `${size}px ${font}`
  //   this.ctx.fillText(text, x, y)
  // },
  onPointerDown(e) {
    this.isDragging = true
    this.dragStart.x = this.getEventLocation(e).x/this.cameraZoom - this.cameraOffset.x
    this.dragStart.y = this.getEventLocation(e).y/this.cameraZoom - this.cameraOffset.y
  },
  onPointerUp() {
    this.isDragging = false
    this.initialPinchDistance = null
    this.lastZoom = this.cameraZoom
  },
  onPointerMove(e) {
      if (this.isDragging) {
        this.cameraOffset.x = this.getEventLocation(e).x/this.cameraZoom - this.dragStart.x
        this.cameraOffset.y = this.getEventLocation(e).y/this.cameraZoom - this.dragStart.y
      }
  },

  handleTouch(e, singleTouchHandler) {
      if ( e.touches.length == 1 ) {
          singleTouchHandler(e)
      }
      else if (e.type == "touchmove" && e.touches.length == 2) {
        this.isDragging = false
        this.handlePinch(e)
      }
  },
  handlePinch(e) {
      e.preventDefault()
      
      let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      
      // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
      let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
      
      if (this.initialPinchDistance == null) {
        this.initialPinchDistance = currentDistance
      }
      else {
        this.adjustZoom( null, currentDistance/this.initialPinchDistance )
      }
  },
  adjustZoom(zoomAmount, zoomFactor) {
      if (!this.isDragging) {
          if (zoomAmount) {
            this.cameraZoom += zoomAmount
          } else if (zoomFactor) {
              console.log(zoomFactor)
              this.cameraZoom = zoomFactor*this.lastZoom
          }
          
          this.cameraZoom = Math.min( this.cameraZoom, this.MAX_ZOOM )
          this.cameraZoom = Math.max( this.cameraZoom, this.MIN_ZOOM )
      }
    },  
  }
}