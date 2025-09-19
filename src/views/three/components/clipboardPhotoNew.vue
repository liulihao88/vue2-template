<template>
  <!-- 这个组件是完全功能性的，不需要任何UI元素，由外部触发 -->
</template>

<script>
import mitt from 'mitt' // 确保已经安装并引入了 mitt
export default {
  name: 'ClipboardPhoto',
  props: {
    // 从外部接收实例
    scene: {
      type: Object, // THREE.Scene
      required: true,
    },
    renderer: {
      type: Object, // THREE.WebGLRenderer
      required: true,
    },
    container: {
      type: HTMLElement, // 包裹 Three.js canvas 的 DOM 容器
      required: true,
    },
    controls: {
      type: Object, // e.g., OrbitControls
      default: null,
    },
  },
  data() {
    return {
      isSelecting: false,

      selectionBox: null, // 选区框的DOM元素
      selectionStart: { x: 0, y: 0 }, // 记录CSS像素坐标
      selectionEnd: { x: 0, y: 0 }, // 记录CSS像素坐标

      konvaStageCanvas: null, // 直接保存 Konva 的顶层 Canvas 元素
    }
  },
  created() {
    // 1. 创建 mitt 实例 (如果父组件没有提供)
    // 2. 监听来自外部的 Konva Stage 信息
    this.$mitt.on('knova-canvas-ready', this.handleKonvaStageReady)
  },
  mounted() {},
  beforeDestroy() {
    // 清理所有事件监听
    this.$mitt.off('knova-canvas-ready', this.handleKonvaStageReady)

    this.cancelSelection() // 确保销毁时取消选区
    window.removeEventListener('mousemove', this.onMouseMove)
    // mousedown/mouseup 应该是一次性的，但以防万一也清理
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  methods: {
    // 接收父组件通过 $mitt.emit 发送过来的 Konva Stage
    handleKonvaStageReady(stage) {
      console.log(`03 stage`, stage)
      // 关键：我们保存的是 Stage 的 content 属性，它是一个包装了 canvas 的 DOM 元素
      console.log(`24 stage.content`, stage.content)
      if (stage && stage.content) {
        this.konvaStageCanvas = stage.content.children[0]
        console.log(`07 this.konvaStageCanvas`, this.konvaStageCanvas)
        console.log('ClipboardPhoto: Konva Canvas 已准备就绪')
      } else {
        console.error('ClipboardPhoto: 接收到的 Konva Stage 数据无效')
      }
    },

    // 开始截图流程
    startSelection() {
      if (this.isSelecting) return
      this.selectionStart = { x: 0, y: 0 }
      this.selectionEnd = { x: 0, y: 0 }

      this.isSelecting = true
      this.$mitt.emit('can-draw', false) // 通知父组件暂停绘制
      if (this.controls) this.controls.enabled = false // 禁用控制器

      // 创建选区框
      this.selectionBox = document.createElement('div')
      this.selectionBox.style.position = 'absolute'
      this.selectionBox.style.border = '2px dashed #FF0000'
      this.selectionBox.style.pointerEvents = 'none'
      this.selectionBox.style.zIndex = '999' // 确保在最上层
      this.selectionBox.style.display = 'none'
      this.container.appendChild(this.selectionBox)

      // 添加事件监听
      window.addEventListener('mousedown', this.onMouseDown, { once: true })
      window.addEventListener('mousemove', this.onMouseMove)
      window.addEventListener('mouseup', this.onMouseUp, { once: true })

      this.$emit('toggleControls', false)
    },

    // 取消截图流程
    cancelSelection() {
      if (!this.isSelecting) return

      this.isSelecting = false
      this.selectionStart = { x: 0, y: 0 }
      this.selectionEnd = { x: 0, y: 0 }

      if (this.controls) this.controls.enabled = true
      this.$mitt.emit('can-draw', true)

      // 移除选区框
      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox)
        this.selectionBox = null
      }

      // 移除移动事件监听
      window.removeEventListener('mousemove', this.onMouseMove)
      this.$emit('toggleControls', true)
    },

    // 鼠标按下，记录起点 (CSS像素)
    onMouseDown(e) {
      if (!this.isSelecting) return
      this.selectionBox.style.display = 'block'
      const rect = this.renderer.domElement.getBoundingClientRect()

      this.selectionStart = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      this.selectionEnd = { ...this.selectionStart }

      // 初始化选区框大小
      this.updateSelectionBoxElement()
    },

    // 鼠标移动，更新选区 (CSS像素)
    onMouseMove(e) {
      if (!this.isSelecting) return

      const rect = this.renderer.domElement.getBoundingClientRect()
      this.selectionEnd = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      // 更新选区框的视觉大小和位置
      this.updateSelectionBoxElement()
    },

    // 更新选区框元素的样式
    updateSelectionBoxElement() {
      if (!this.selectionBox || !this.selectionStart) return

      const x = Math.min(this.selectionStart.x, this.selectionEnd.x)
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y)
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      // 关键：使用 CSS 像素直接设置样式，确保视觉上和用户拖拽一致
      this.selectionBox.style.left = `${x}px`
      this.selectionBox.style.top = `${y}px`
      this.selectionBox.style.width = `${width}px`
      this.selectionBox.style.height = `${height}px`
    },

    // 鼠标抬起，执行截图
    onMouseUp() {
      if (!this.isSelecting || !this.selectionStart.x) return

      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      // 防止误操作，选区太小则取消
      if (width < 5 || height < 5) {
        this.cancelSelection()
        return
      }

      // 获取最终的选区数据 (单位为 CSS 像素)
      const finalSelection = {
        x: Math.min(this.selectionStart.x, this.selectionEnd.x),
        y: Math.min(this.selectionStart.y, this.selectionEnd.y),
        width: width,
        height: height,
      }

      this.captureSelection(finalSelection)
      this.cancelSelection() // 完成截图后自动取消模式
    },

    // 核心截图函数
    captureSelection(selectionRect) {
      const dpr = window.devicePixelRatio || 1
      console.log(`21 dpr`, dpr)

      // 1. 创建一个离屏 Canvas 用于混合最终图像
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = selectionRect.width  // 物理像素宽度
      finalCanvas.height = selectionRect.height // 物理像素高度
      const finalCtx = finalCanvas.getContext('2d')
      if (!finalCtx) return

      // 2. 从 Three.js Canvas 绘制背景层
      // 将 CSS 像素坐标/尺寸转换为物理像素
      console.log(`26 selectionRect.x`, selectionRect.x);
      console.log(`14 selectionRect.y`, selectionRect.y);
      console.log(`37 selectionRect.width`, selectionRect.width);
      console.log(`49 selectionRect.height`, selectionRect.height);
      console.log(`78 finalCanvas.width`, finalCanvas.width);
      console.log(`09 finalCanvas.height`, finalCanvas.height);
      finalCtx.drawImage(
        this.renderer.domElement,
        selectionRect.x,
        selectionRect.y,
        selectionRect.width,
        selectionRect.height,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height,
      )

      // 3. 从 Konva Canvas 绘制前景层
      // **重要**：这里假设 this.konvaStageCanvas 的物理尺寸与 this.renderer.domElement 一致
      console.log(`73 this.konvaStageCanvas`, this.konvaStageCanvas)
      if (this.konvaStageCanvas) {
        finalCtx.drawImage(
          this.konvaStageCanvas,
          selectionRect.x,
          selectionRect.y,
          selectionRect.width,
          selectionRect.height,
          0,
          0,
          finalCanvas.width,
          finalCanvas.height,
        )
      } else {
        console.warn('Konva Canvas 未加载，无法绘制前景层')
      }

      // 4. 下载图片
      finalCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `composite-screenshot-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    },
  },
}
</script>

<style scoped lang="scss">
/* 此组件为功能组件，无需额外样式 */
</style>
