<template>
  <div class="box">
    <div class="title">元素属性</div>
    <div class="box-container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "GAbsoluteBox",
  components: {},
  props: {},
  data() {
    return {};
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {}
};
</script>
<style scoped lang="scss">
.box {
  position: absolute;
  overflow: hidden;
  z-index: auto;
  left: 0;
  top: 50%;
  // padding: 16px;
  color: #fff;
  width: 20%;
  height: 50vh;
  background: #000;
  font-size: 12px;
  .title {
    font-size: 14px;
    font-weight: 600;
    background: #3b4453;
    display: inline-block;
    padding: 4px 20px 4px 8px;
    border-radius: 4px 4px 0 0;
    box-shadow: 12px 4px 12px 0 rgba(4, 25, 25, 0.1);
  }
  .box-container {
    background: #3b4453;
    padding: 16px 4px;
    height: 100%;
  }
}
</style>
