<template>
  <div class="header-wrapper">
    <img src="/icons/logo.svg" alt="">
  </div>
</template>
<script>
export default {
  name: 'HeaderComponent',
  data() {
    return {}
  }
}
</script>
<style>
.header-wrapper {
  position: fixed;
  display: flex;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  max-height: 100px;
  background: #7000FF;
  z-index: 10;
  padding: 10px 100px;
}
img {
    height: 70px;
}

</style>