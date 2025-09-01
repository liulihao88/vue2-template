<template>
  <div class="box" :style="{ ...customStyle }">
    <section class="lm_header" style="height: 30px">
      <section class="lm_tabs">
        <div class="lm_tab" style="z-index: auto">
          <span class="lm_title">{{ title }}</span>
        </div>
      </section>
      <section class="lm_controls">
        <slot name="right"></slot>
      </section>
      <section class="lm_tabdropdown_list" style="display: none"></section>
    </section>
    <div class="box-container">
      <el-scrollbar>
        <slot></slot>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GAbsoluteBox',
  components: {},
  props: {
    title: {
      type: String,
      default: '',
    },
    customStyle: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss">
.box {
  position: absolute;
  z-index: auto;
  color: #fff;
  width: 300px;
  height: 50vh;
  background: #000;
  font-size: 12px;
  .lm_header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    user-select: none;
    align-items: center;
    overflow: visible;
    height: 100px;
    border-bottom: 3px solid rgb(59, 68, 83);
    .lm_tabs {
      position: absolute;
      display: flex;

      .lm_tab {
        box-shadow: rgba(0, 0, 0, 0.8) 0px -2px 3px;
        padding-bottom: 5px;
        border-bottom: none;
        display: flex;
        align-items: center;

        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #fff;
        box-shadow: rgba(0, 0, 0, 0.5) 2px -2px 2px;
        margin-right: 2px;
        padding-bottom: 2px;
        padding-top: 2px;
        cursor: pointer;
        float: left;
        height: 100%;
        margin-top: 1px;
        position: relative;
        touch-action: none;
        padding: 2px 25px 2px 10px;
        margin-left: 4px;
        background: #3b4453;
        border-radius: 4px 4px 0px 0px;
      }
    }
    .lm_controls {
      position: absolute;
      right: 20px;
      display: flex;
      align-items: center;
      > * {
        cursor: pointer;
        text-align: center;
      }
    }
  }
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
    padding: 8px;
    height: 100%;
    ::v-deep .el-scrollbar {
      height: calc(100% - 30px);
    }
  }
}
</style>
