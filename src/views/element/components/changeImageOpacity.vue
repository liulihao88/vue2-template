<template>
  <div class="demo-image__preview">
    <el-image
      style="width: 100px; height: 100px"
      :src="url"
      :preview-src-list="srcList"
      @click="opacityToOne"
      custom-class="abcd"
      class="abcd"></el-image>
  </div>
</template>

<script>
export default {
  name: 'CHangeImageOpacity',
  components: {},
  props: {},
  data() {
    return {
      url: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
      srcList: [
        'https://fuss10.elemecdn.com/8/27/f01c15bb73e1ef3793e64e6b7bbccjpeg.jpeg',
        'https://fuss10.elemecdn.com/1/8e/aeffeb4de74e2fde4bd74fc7b4486jpeg.jpeg',
      ],
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    // this.init()
  },
  methods: {
    /**
     * @description 方案1, 使用js
     *
     * @description 方案2, 全局修改, 全局使用公共class
     *
     */
    // .el-image-viewer__wrapper {
    //   .el-image-viewer__mask {
    //     opacity: 1 !important;
    //     background-color: #000; /* 同时也可以修改其他样式 */
    //   }
    // }
    opacityToOne() {
      // $nextTick 是 Vue 提供的，用来在下次 DOM 更新循环结束之后执行延迟回调
      this.$nextTick(() => {
        // 在 body 中查找被动态创建的遮罩层
        const mask = document.body.querySelector('.el-image-viewer__mask')
        console.log(`26 mask`, mask)
        if (mask) {
          // 直接操作 DOM 的 style 属性，它的优先级是最高的，可以覆盖所有 CSS 规则
          mask.style.opacity = '1.0'
        }
      })
    },
  },
}
</script>
<style scoped lang="scss"></style>
