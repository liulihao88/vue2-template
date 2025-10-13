<template>
  <div class="toolbar">
    <div data-v-78bdb7f6="" class="toolbar-buttons">
      <div class="image-button-checkbox" @click="resetModel">
        <svg-icon icon-class="reset" class="icon-dom" />
        <span data-v-6fec4127="" class="text">复位</span>
      </div>
      <!-- <div
        class="image-button-checkbox"
        :class="{ 'is-active': sActiveArr.includes('clipboard') }"
        @click="clipboardHandler">
        <svg-icon icon-class="clipboard" class="icon-dom" crossorigin="anonymous" />
        <span data-v-6fec4127="" class="text">剪切</span>
      </div> -->
      <div class="image-button-checkbox" @click="fullScreen">
        <div id="bimi_tbFullScreen" class="myfont iconquanping" title="全屏"></div>
        <span data-v-6fec4127="" class="text">{{ isPageFullscreen ? '退出全屏' : '全屏' }}</span>
      </div>
      <div class="image-button-checkbox" :class="{ 'is-active': sActiveArr.includes('mouse') }" @click="mouseCatch">
        <div id="bimi_tbMouseCapture" class="myfont iconmouse" title="鼠标捕捉"></div>
        <span data-v-6fec4127="" class="text">鼠标捕获</span>
      </div>

      <div class="image-button-checkbox" :class="{ 'is-active': sActiveArr.includes('review') }" @click="reviewHandler">
        <svg-icon icon-class="review" class="icon-dom" />
        <span data-v-6fec4127="" class="text">审查</span>
      </div>
    </div>
  </div>
</template>

<script>
import Immediate from '../immediate.vue'
import { clone } from '@/utils/gFunc.js'
export default {
  name: 'T3',
  components: {},
  props: {
    activeArr: {
      // [clipboard, review, mouse]
      type: Array,
      default: () => {
        return []
      },
    },
  },

  data() {
    return {
      sActiveArr: this.activeArr,
      isPageFullscreen: false,
    }
  },
  computed: {},
  watch: {
    activeArr: {
      handler(arr) {
        this.sActiveArr = arr
      },
      deep: true,
      Immediate: true,
    },
  },
  created() {},
  mounted() {},
  methods: {
    fullScreen() {
      if (this.isPageFullscreen) {
        document.exitFullscreen()
        this.isPageFullscreen = false
      } else {
        document.documentElement.requestFullscreen()
        this.isPageFullscreen = true
      }
    },
    mouseCatch() {
      this.toggleVar('mouseCatch')
    },
    reviewHandler() {
      this.toggleVar('review')
    },
    resetModel() {
      this.$emit('resetModel')
    },
    toggleVar(variable) {
      let cloneData = clone(this.sActiveArr)
      if (cloneData.includes(variable)) {
        cloneData = cloneData.filter((v) => v !== variable)
      } else {
        cloneData = [...cloneData, variable]
      }
      this.$emit('toggleClick', cloneData)
    },
  },
}
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
    .is-active {
      background-color: rgb(196, 196, 196) !important;
      color: rgb(0, 0, 0) !important;
    }
  }
}
</style>
