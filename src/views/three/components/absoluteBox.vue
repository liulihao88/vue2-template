<template>
  <div class="box" :style="{ ...customStyle }">
    <section class="lm_header" style="height: 30px">
      <section class="lm_tabs">
        <div class="lm_tab" style="z-index: auto">
          <el-tooltip :disabled="!showTooltip" :content="title" placement="top">
            <span ref="titleRef" class="lm_title" :style="{ maxWidth: titleMaxWidth + 'px' }">{{ title }}</span>
          </el-tooltip>
        </div>
      </section>
      <section ref="controlsRef" class="lm_controls">
        <slot name="right"></slot>
      </section>
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
  props: {
    title: {
      type: String,
      default: '',
    },
    customStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      showTooltip: false,
      titleMaxWidth: 0,
    }
  },
  watch: {
    title() {
      this.$nextTick(this.checkTitleOverflow)
    },
  },
  mounted() {
    this.checkTitleOverflow()
    this.resizeObserver = new ResizeObserver(this.checkTitleOverflow)
    this.resizeObserver.observe(this.$refs.controlsRef)
    this.resizeObserver.observe(this.$el)
  },
  beforeDestroy() {
    this.resizeObserver?.disconnect()
  },
  methods: {
    checkTitleOverflow() {
      if (!this.$refs.titleRef || !this.$refs.controlsRef) return

      const headerWidth = this.$el.clientWidth
      const controlsWidth = this.$refs.controlsRef.clientWidth
      const paddingRight = 20 // .lm_controls 的 right: 20px
      const buffer = 20 // 额外缓冲空间

      this.titleMaxWidth = headerWidth - controlsWidth - paddingRight - buffer - 30

      const titleEl = this.$refs.titleRef
      this.showTooltip = titleEl.scrollWidth > titleEl.offsetWidth
    },
  },
}
</script>

<style scoped lang="scss">
.box {
  position: absolute;
  z-index: auto;
  color: #fff;
  width: 300px;
  display: flex;
  flex-direction: column;
  height: 50vh;
  font-size: 12px;
  background: #000;

  .lm_header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    user-select: none;
    align-items: center;
    overflow: visible;
    height: 100%;
    border-bottom: 3px solid rgb(59, 68, 83);
    width: 100%;

    .lm_tabs {
      position: absolute;
      display: flex;
      height: 100%;
      max-width: none;

      .lm_tab {
        background: #3b4453;
        box-shadow: rgba(0, 0, 0, 0.8) 0px -2px 3px;
        padding-bottom: 5px;
        border-bottom: none;
        display: flex;
        align-items: center;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #fff;
        box-shadow: rgba(0, 0, 0, 0.5) 2px -2px 2px;
        padding-bottom: 2px;
        padding-top: 2px;
        cursor: pointer;
        float: left;
        height: 100%;
        position: relative;
        touch-action: none;
        padding: 2px 25px 2px 10px;
        background: #3b4453;
        border-radius: 0px 4px 0px 0px;
        max-width: 100%;
        margin: 1px 2px 0 10px;

        .lm_title {
          display: inline-block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
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

  .box-container {
    background: #3b4453;
    flex: 1;
    padding: 8px;
    height: 100%;
    overflow: hidden;

    ::v-deep .el-scrollbar {
      height: 100%;
      .el-scrollbar__wrap {
        overflow-x: hidden;
      }
    }
  }
}
</style>
