<template>
  <div>
    <div ref="panel" id="bimi_panel_1760519153199" :style="{ ...customStyle }" class="bim-panel">
      <div id="bimi_panel_close" class="bim-panel-close" @click="close"></div>
      <div ref="header" id="bimi_panel_title" class="bim-panel-title">{{ title }}</div>
      <!--主体-->
      <div class="bim-panel-body">
        <el-scrollbar>
          <slot></slot>
        </el-scrollbar>
      </div>
      <div ref="resizeHandle" class="bim-resize"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GCusDialog',
  components: {},
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
      // 拖拽相关数据
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      panelStartX: 0,
      panelStartY: 0,

      // 调整大小相关数据
      isResizing: false,
      resizeStartX: 0,
      resizeStartY: 0,
      panelStartWidth: 0,
      panelStartHeight: 0,
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    this.initDragEvents()
    this.initResizeEvents()
  },
  beforeDestroy() {
    this.removeDragEvents()
    this.removeResizeEvents()
  },
  methods: {
    close(){
      this.$emit('close')
    },
    // --- 拖拽功能相关方法 ---
    initDragEvents() {
      const header = this.$refs.header
      header.addEventListener('mousedown', this.onMouseDownForDrag)
    },
    removeDragEvents() {
      document.removeEventListener('mousemove', this.onMouseMove)
      // 修改1: 引用独立的拖拽结束函数
      document.removeEventListener('mouseup', this.onDragEnd)
    },
    onMouseDownForDrag(e) {
      e.stopPropagation()
      this.isDragging = true
      this.dragStartX = e.clientX
      console.log(`94 e.clientX`, e.clientX);
      this.dragStartY = e.clientY
      this.panelStartX = parseFloat(this.$refs.panel.style.left) || 0
      this.panelStartY = parseFloat(this.$refs.panel.style.top) || 0

      document.addEventListener('mousemove', this.onMouseMove)
      // 修改2: 绑定独立的拖拽结束函数
      document.addEventListener('mouseup', this.onDragEnd)
    },
    onMouseMove(e) {
      if (!this.isDragging) return
      const deltaX = e.clientX - this.dragStartX
      const deltaY = e.clientY - this.dragStartY
      const newLeft = this.panelStartX + deltaX
      const newTop = this.panelStartY + deltaY
      this.$refs.panel.style.left = `${newLeft}px`
      this.$refs.panel.style.top = `${newTop}px`
    },
    // 修改3: 创建独立的拖拽结束函数
    onDragEnd() {
      this.isDragging = false
      this.removeDragEvents() // 这里会移除mousemove和onDragEnd自身
    },

    // --- 调整大小功能相关方法 ---
    initResizeEvents() {
      const resizeHandle = this.$refs.resizeHandle
      resizeHandle.addEventListener('mousedown', this.onMouseDownForResize)
    },
    removeResizeEvents() {
      document.removeEventListener('mousemove', this.onResizeMove)
      // 修改4: 引用独立的调整结束函数
      document.removeEventListener('mouseup', this.onResizeEnd)
    },
    onMouseDownForResize(e) {
      e.stopPropagation()
      this.isResizing = true
      this.resizeStartX = e.clientX
      this.resizeStartY = e.clientY
      this.panelStartWidth = this.$refs.panel.offsetWidth
      this.panelStartHeight = this.$refs.panel.offsetHeight
      document.body.style.cursor = 'nw-resize'

      document.addEventListener('mousemove', this.onResizeMove)
      // 修改5: 绑定独立的调整结束函数
      document.addEventListener('mouseup', this.onResizeEnd)
    },
    onResizeMove(e) {
      if (!this.isResizing) return
      const deltaX = e.clientX - this.resizeStartX
      const deltaY = e.clientY - this.resizeStartY
      const newWidth = Math.max(100, this.panelStartWidth + deltaX)
      const newHeight = Math.max(80, this.panelStartHeight + deltaY)
      this.$refs.panel.style.width = `${newWidth}px`
      this.$refs.panel.style.height = `${newHeight}px`
    },
    // 修改6: 创建独立的调整结束函数
    onResizeEnd() {
      this.isResizing = false
      document.body.style.cursor = '' // 恢复光标
      this.removeResizeEvents() // 这里会移除mousemove和onResizeEnd自身
    },
  },
}
</script>

<!-- <style> 部分保持不变 -->
<style scoped lang="scss">
.bim-panel {
  width: 200px;
  height: 100px;
  color: #fff;
  position: absolute;
  overflow: hidden;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  background-color: rgba(17, 17, 17, 0.88);
  z-index: 9;
  border: 1px solid #333;
  box-sizing: border-box;
  padding-top: 40px;
}
.bim-panel .bim-panel-title {
  box-sizing: border-box;
  cursor: move;
  padding: 10px 30px 10px 10px;
  line-height: 20px;
  font-size: 14px;
  user-select: none;
  border-bottom: 1px solid #666;
  background-color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  top: 40px; /* 修正标题栏定位，覆盖在padding上 */
  left: 0;
  right: 0;
  z-index: 10;
}
.bim-resize {
  height: 10px;
  width: 10px;
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
  cursor: nw-resize;
}
.bim-resize::after {
  display: block;
  float: right;
  content: '';
  width: 100%;
  height: 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAABGdBTUEAALGPC/xhBQAAAF5JREFUCB1jYEADq1at4r927dpOJmRxkKC+vv5ORkbGG3BxkODNmzdPXL9+fSJWwf///zNfvnx5CTNM+79//05qaGgUAXUtBeoQYARZBDJTU1MzH6SSiYlJaMaMGYEA7E42FFiHq5AAAAAASUVORK5CYII=)
    no-repeat;
  cursor: nw-resize;
}
.bim-panel-close {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  z-index: 11;
}
.bim-panel-body {
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
</style>
