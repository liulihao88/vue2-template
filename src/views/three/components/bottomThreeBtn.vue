<template>
  <div class="toolbar">
    <div data-v-78bdb7f6="" class="toolbar-buttons">
      <div class="image-button-checkbox" @click="resetModel">
        <!-- <svg-icon icon-class="reset" class="icon-dom" /> -->
        <div id="bimi_tbFullScreen" class="iconfont iconzhushijiao"></div>
        <span data-v-6fec4127="" class="text">主视角</span>
      </div>
      <div class="image-button-checkbox" @click="fullScreen">
        <div
          id="bimi_tbFullScreen"
          class="myfont"
          title="全屏"
          :class="[isPageFullscreen ? 'icon-outquanping' : ' iconquanping']"></div>
        <span data-v-6fec4127="" class="text">{{ isPageFullscreen ? '退出全屏' : '全屏' }}</span>
      </div>
      <div
        class="image-button-checkbox"
        :class="{ 'is-active': sActiveArr.includes('statistics'), 'not-allowed': isReview }"
        @click="statisticsHandler">
        <div id="bimi_tbSummary" class="myfont icontongji" title="统计"></div>
        <span data-v-6fec4127="" class="text">统计</span>
      </div>

      <div
        class="image-button-checkbox"
        :class="{ 'is-active': sActiveArr.includes('mouse'), 'not-allowed': isReview }"
        @click="mouseCatch">
        <div id="bimi_tbMouseCapture" class="myfont iconmouse" title="鼠标捕捉"></div>
        <span data-v-6fec4127="" class="text">鼠标捕获</span>
      </div>

      <div class="image-button-checkbox" :class="{ 'is-active': sActiveArr.includes('review') }" @click="reviewHandler">
        <div id="" class="myfont icon-check"></div>
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
      // [clipboard, review, mouse, statistics]
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
  computed: {
    isReview() {
      return this.activeArr.includes('review')
    },
  },
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
    statisticsHandler() {
      if (this.isReview) {
        return
      }
      this.toggleVar('statistics')
    },
    mouseCatch() {
      if (this.isReview) {
        return
      }
      this.toggleVar('mouse')
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
        cloneData = []
      } else {
        cloneData = [variable]
      }
      // if (variable === 'review') {
      //   cloneData = cloneData.filter((v) => {
      //     return v !== 'mouse' && v !== 'statistics'
      //   })
      // }
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
    .not-allowed {
      cursor: not-allowed;
    }
  }
}
</style>
