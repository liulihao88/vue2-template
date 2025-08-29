<template>
  <div class="toolbar">
    <div data-v-78bdb7f6="" class="toolbar-buttons">
      <div class="image-button-checkbox" @click="clipboardHandler">
        <svg-icon icon-class="clipboard" class="icon-dom" />
        <span data-v-6fec4127="" class="text">剪切</span>
      </div>
      <div class="image-button-checkbox" @click="reviewHandler">
        <svg-icon icon-class="review" class="icon-dom" />
        <span data-v-6fec4127="" class="text">审查</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "T3",
  components: {},
  props: {},
  data() {
    return {};
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    clipboardHandler(){
      this.$emit('clipboardHandler')
    },
    reviewHandler(){
      this.$emit('reviewHandler')
    }
  }
};
</script>
<style scoped lang="scss">
.toolbar {
  bottom: 80px;
  position: absolute;
  text-align: center;
  width: 100%;
  z-index: 5;
  box-sizing: content-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  .toolbar-buttons {
    display: flex;
    justify-content: center;
    padding: 8px 10px;
    background: #3b4453;
    border-radius: 8px;
    .image-button-checkbox {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 2px 6px;
      margin-left: 4px;
      margin-right: 4px;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      border-radius: 4px;
      .icon-dom {
        margin-bottom: 4px;
      }
      &:hover {
        background-color: rgb(196, 196, 196);
        color: rgb(0, 0, 0);
      }
    }
  }
}
</style>
