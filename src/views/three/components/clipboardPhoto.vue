<template>
  <!-- <el-button @click="startSelection" type="primary" size="small">截图</el-button> -->
</template>

<script>
import Konva from 'konva'
export default {
  name: 'ClipboardPhoto',
  components: {},
  props: {
    scene: {
      type: '',
      required: true,
    },
    renderer: {
      type: '',
      required: true,
    },
    container: {
      type: '',
      required: true,
    },
    knovaCanvasRef: {
      type: '',
    },
  },
  data() {
    return {
      // scene: null,
      // 新增截图相关状态
      isSelecting: false,
      selectionStart: { x: 0, y: 0 },
      selectionEnd: { x: 0, y: 0 },
      localKnovaCanvasRef: null,
    }
  },
  computed: {},
  watch: {},
  created() {
    // 在组件创建后，立即监听事件
    console.log(`82 this.$mitt`, this.$mitt)
    this.$mitt.on('knova-canvas-ready', this.handleKnovaCanvasReady)
  },
  mounted() {},
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('mousedown', this.onMouseDown) // 清理事件
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.$mitt.off('knova-canvas-ready', this.handleKnovaCanvasReady)
  },
  methods: {
    // 定义事件处理函数
    handleKnovaCanvasReady(canvasElement) {
      console.log('ComponentB: Received knova canvas ref!', canvasElement)
      this.localKnovaCanvasRef = canvasElement
    },
    // **新增：取消选区**
    cancelSelection() {
      this.$mitt.emit('can-draw', true);
      this.isSelecting = false
      this.selectionStart = { x: 0, y: 0 }
      this.selectionEnd = { x: 0, y: 0 }

      // 恢复控制器
      if (this.controls) this.controls.enabled = true

      // 移除选区框
      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox)
        this.selectionBox = null
      }

      // 移除事件监听
      window.removeEventListener('mousedown', this.onMouseDown)
      window.removeEventListener('mousemove', this.onMouseMove)
      window.removeEventListener('mouseup', this.onMouseUp)
      this.$emit('toggleControls', true)
    },

    // **新增：开始选区模式**
    startSelection() {
      this.$mitt.emit('can-draw', false);
      this.isSelecting = true

      // 移除原有的控制器交互（避免冲突）
      if (this.controls) this.controls.enabled = false

      // 初始化选区框（一个2D矩形）
      this.selectionBox = document.createElement('div')
      this.selectionBox.style.position = 'absolute'
      this.selectionBox.style.border = '2px dashed #FF0000'
      this.selectionBox.style.pointerEvents = 'none'
      this.container.appendChild(this.selectionBox)

      // 绑定鼠标事件
      window.addEventListener('mousedown', this.onMouseDown)
      window.addEventListener('mousemove', this.onMouseMove)
      window.addEventListener('mouseup', this.onMouseUp)
    },
    // **新增：鼠标按下（开始选择）**
    onMouseDown(e) {
      if (!this.isSelecting) return
      this.$emit('toggleControls', false)
      const rect = this.renderer.domElement.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1 // 关键修复

      this.selectionStart = {
        x: (e.clientX - rect.left) * dpr, // 修正坐标
        y: (e.clientY - rect.top) * dpr,
      }
    },

    // **新增：鼠标移动（更新选区框）**
    onMouseMove(e) {
      if (!this.isSelecting || !this.selectionStart.x) return

      const rect = this.renderer.domElement.getBoundingClientRect()
      this.selectionEnd = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      // 更新选区框位置和大小
      this.updateSelectionBox()
    },
    // **新增：更新选区框的显示**
    updateSelectionBox() {
      if (!this.selectionBox) return

      const x = Math.min(this.selectionStart.x, this.selectionEnd.x)
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y)
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      this.selectionBox.style.left = `${x}px`
      this.selectionBox.style.top = `${y}px`
      this.selectionBox.style.width = `${width}px`
      this.selectionBox.style.height = `${height}px`
    },

    // **新增：鼠标抬起（完成选择，截图）**
    onMouseUp() {
      if (!this.isSelecting || !this.selectionStart.x || !this.selectionEnd.x) return

      // 获取选区坐标（规范化）
      const x = Math.min(this.selectionStart.x, this.selectionEnd.x)
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y)
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      // 检查选区有效性
      if (width < 1 || height < 1) {
        this.cancelSelection()
        return
      }

      // 截取选中区域
      this.captureSelection(x, y, width, height)
      // this.testImg();

      // 退出选区模式
      this.cancelSelection()
    },
    // **新增：截取选中区域并下载**
    captureSelection(x, y, width, height) {
      const dpr = window.devicePixelRatio || 1

      // 1. 创建最终混合的 Canvas，尺寸是选区的设备像素尺寸
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = width * dpr
      finalCanvas.height = height * dpr
      const finalCtx = finalCanvas.getContext('2d')
      if (!finalCtx) return
      // 2. 在最终画布上绘制 Three.js 的背景层
      const threeDprOffsetX = x * dpr
      const threeDprOffsetY = y * dpr
      finalCtx.drawImage(
        this.renderer.domElement, // 源: Three.js 画布
        threeDprOffsetX,
        threeDprOffsetY, // 源裁剪起点
        width * dpr,
        height * dpr, // 源裁剪尺寸
        0,
        0, // 目标放置起点
        width * dpr,
        height * dpr, // 目标尺寸
      )
      // 3. 关键一步：在最终画布上绘制 Knova 的前景层
      // 确保你拿到了 Knova 画布的引用！
      const knovaCanvas = this.localKnovaCanvasRef // 如果是用 props 传递的
      // ---- 在你的 captureScreenshot 方法里 ----
      // ... 假设你已经有这些变量 ...
      // const finalCtx = destinationCanvas.getContext('2d');
      // const x, y, width, height, dpr 都已经计算好了
      // const knovaCanvas = ... // 这里引用了你的源canvas
      // ====================== 调试代码开始 ======================
      console.log(`--- drawImage 调试开始 ---`)
      console.log('1. 最终的 knovaCanvas 变量是:', knovaCanvas)
      console.log('2. knovaCanvas 的类型是:', typeof knovaCanvas)
      // 关键检查：它是不是 Konva.Stage 的实例？
      console.log('3. knovaCanvas 是 Konva.Stage 的实例吗?', knovaCanvas instanceof Konva.Stage)
      // 如果 knovaCanvas 真的是 Konva.Stage，我们再检查它的 content
      if (knovaCanvas instanceof Konva.Stage) {
        console.log('4. 这个 Stage 实例的 content 属性是:', knovaCanvas.content)
        console.log('5. content 的类型是:', typeof knovaCanvas.content)
        console.log('6. content 是一个 HTMLCanvasElement 吗?', knovaCanvas.content instanceof HTMLCanvasElement)
        console.log('7. content 是一个 HTMLImageElement 吗?', knovaCanvas.content instanceof HTMLImageElement)
        console.log('8. content 是 null 或 undefined 吗?', knovaCanvas.content == null)
      } else {
        console.log('!!! 警告：konovaCanvas 不是 Konva.Stage 实例，无法通过 knovaCanvas.content 获取 DOM 元素 !!!')
      }
      console.log('9. finalCtx 是否存在?', !!finalCtx)
      if (finalCtx) {
        console.log('10. finalCtx 是否是一个 CanvasRenderingContext2D?', finalCtx instanceof CanvasRenderingContext2D)
      }
      // ====================== 调试代码结束 ======================
      // 你原有的 drawImage 代码
      if (knovaCanvas) {
        const knovaDprOffsetX = x * dpr
        const knovaDprOffsetY = y * dpr
        console.log('即将执行 drawImage，参数如下：')
        console.log('- 源 (knovaCanvas):', knovaCanvas)
        console.log('- 源 X:', knovaDprOffsetX, ' Y:', knovaDprOffsetY)
        console.log('- 源 宽:', width * dpr, ' 高:', height * dpr)
        console.log('- 目标 X:', 0, ' Y:', 0)
        console.log('- 目标 宽:', width * dpr, ' 高:', height * dpr)
        finalCtx.drawImage(
          knovaCanvas.content.children[0],
          knovaDprOffsetX,
          knovaDprOffsetY,
          width * dpr,
          height * dpr,
          0,
          0,
          width * dpr,
          height * dpr,
        )
        console.log('--- drawImage 调试结束 (成功或失败后) ---')
      } else {
        console.error('!!! knovaCanvas 在 drawImage 前为 falsy 值，跳过绘制 !!!')
      }
      console.log(`42 finalCanvas`, finalCanvas)
      // 4. 下载混合后的最终画布
      finalCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'threejs-knova-screenshot.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
      // (测试用) 显示最终混合图片
      const testImg = new Image()
      testImg.src = finalCanvas.toDataURL()
      testImg.style.position = 'fixed'
      testImg.style.top = '10px'
      testImg.style.left = '10px'
      testImg.style.border = '3px solid purple'
      testImg.style.zIndex = '10001'
      document.body.appendChild(testImg)
      setTimeout(() => testImg.remove(), 5000)
    },
  },
}
</script>
<style scoped lang="scss"></style>
