<template>
  <div class="footer-wrapper">
    <div class="content">
      <div class="email-block">
        <div class="title">Email:</div>
        <a href="mailto:segmint.app@gmail.com" class="email">segmint.app@gmail.com</a>
      </div>
      <div class="socials-block">
        <div class="title">Social networks:</div>
        <div class="socials">
          <a href="https://x.com/segmintapp" target="_blank"><img :src="`${publicPath}icons/socials-x.svg`" alt="x"></a>
          <a href="https://discord.gg/gsYmc6uf" target="_blank"><img :src="`${publicPath}icons/socials-discord.svg`" alt="discord"></a>
          <a href="https://t.me/segmintapp" target="_blank"><img :src="`${publicPath}icons/socials-telegram.svg`" alt="telegram"></a>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'FooterComponent',
  data () {
    return {
      publicPath: process.env.BASE_URL
    }
  }
}
</script>
<style scoped>
.footer-wrapper {
  position: sticky;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: var(--yellow);
  background-color: var(--dark);
  border-top: 2px solid var(--yellow);
  padding: 10px 50px;
}
.content {
  display: flex;
  align-items: flex-start;
}
.title {
  font-size: 14px;
  font-weight: 300;
  margin-bottom: 8px;
}
.email {
  font-size: 24px;
  color: var(--yellow);
  text-decoration: none;
}
.email:hover {
  text-decoration: underline;
}
.email-block {
  margin-right: 35px;
}
.socials img {
  margin-right: 15px;
}
@media only screen and (max-width: 600px) {
  .content {
    flex-direction: column;
  }
  .email-block {
    margin-right: 0;
    margin-bottom: 20px;
  }
}
</style>
