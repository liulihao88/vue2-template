<template>
  <!-- <el-button @click="startSelection" type="primary" size="small">截图</el-button> -->
</template>

<script>
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
  },
  data() {
    return {
      // scene: null,
      // 新增截图相关状态
      isSelecting: false,
      selectionStart: { x: 0, y: 0 },
      selectionEnd: { x: 0, y: 0 },
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('mousedown', this.onMouseDown) // 清理事件
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  methods: {
    // **新增：取消选区**
    cancelSelection() {
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
    },

    // **新增：开始选区模式**
    startSelection() {
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

      // 1. 创建临时Canvas（大小按实际像素计算）
      const canvas = document.createElement('canvas')
      canvas.width = width * dpr
      canvas.height = height * dpr

      // 2. 修正选区坐标（乘以DPR）
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        this.renderer.domElement,
        x * dpr,
        y * dpr, // 源起点
        width * dpr,
        height * dpr, // 源宽高
        0,
        0, // 目标起点
        width * dpr,
        height * dpr, // 目标宽高
      )

      // 3. 下载（调整为实际尺寸）
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'threejs-screenshot.png'
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')

      // 测试图片能否显示
      const testImg = new Image()
      testImg.src = canvas.toDataURL()
      testImg.style.position = 'fixed'
      testImg.style.top = '0'
      testImg.style.left = '0'
      testImg.style.zIndex = '10000'
      document.body.appendChild(testImg)
      setTimeout(() => testImg.remove(), 3000)
    },
  },
}
</script>
<style scoped lang="scss"></style>
