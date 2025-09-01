<template>
  <div class="parent-container">
    <!-- <el-button type="primary" @click="clipboardPhoto">截图</el-button> -->
    <el-button type="primary" @click="innerClip">调用内部的截图</el-button>
    <!-- <g-three-scene class="scene-component" ref="threeSceneRef" /> -->
    <!-- <g-three-url></g-three-url> -->
    <g-check-photo ref="checkPhotoRef"></g-check-photo>
    <!-- <ThreeBtn></ThreeBtn> -->
  </div>
</template>

<script>
import ThreeBtn from '@/views/form/threeBtn.vue'
export default {
  components: {
    ThreeBtn,
  },
  data() {
    return {}
  },
  methods: {
    innerClip() {
      this.$refs.checkPhotoRef.$refs.clipboardPhotoRef.startSelection()
    },
    clipboardPhoto() {
      // 获取Three.js渲染器的Canvas元素
      // 代码触发截图
      console.log(`59 this.$refs`, this.$refs)
      console.log(`95 this.$refs.threeSceneRef`, this.$refs.threeSceneRef)
      let renderer = this.$refs.threeSceneRef.scene
      console.log(`74 renderer`, renderer)

      // 1. 将渲染器的Canvas转为DataURL（PNG格式）
      const renderContext = renderer.getContext()
      console.log(`49 renderContext`, renderContext)
      const canvas = renderer.domElement
      console.log(`07 canvas`, canvas)
      const dataURL = canvas.toDataURL('image/png')
      // 2. 创建一个下载链接
      const link = document.createElement('a')
      link.href = dataURL
      link.download = 'screenshot.png' // 下载文件名
      link.click()
    },
  },
}
</script>

<style>
.parent-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scene-component {
  flex: 1;
  border: 1px solid #ccc;
}
</style>
