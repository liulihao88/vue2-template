<template>
  <!-- 截图按钮 -->
  <el-button @click="startSelection" type="primary" size="small">截图</el-button>
</template>

<script>
import html2canvas from 'html2canvas'

export default {
  name: 'ClipboardPhoto',
  props: {
    // 截图的目标区域容器，我们直接截它
    screenshotTargetArea: {
      type: [HTMLElement],
    },
    // Konva Stage 的实例
  },
  data() {
    return {
      isSelecting: false,
      selectionStart: { x: 0, y: 0 },
      selectionEnd: { x: 0, y: 0 },
      // 选区框会被生成的 canvas 替换
      selectionBox: null,
      // 用于捕获鼠标事件相对于目标容器的坐标
      targetRect: null,
      localKnovaCanvasRef: null,
    }
  },
  created() {
    if (this.$mitt) {
      this.$mitt.on('knova-canvas-ready', this.handleKnovaCanvasReady)
    }
  },
  beforeDestroy() {
    this.cancelSelection()
    if (this.$mitt && this.$mitt.off) {
      this.$mitt.off('knova-canvas-ready', this.handleKnovaCanvasReady)
    }
  },
  methods: {
    handleKnovaCanvasReady(canvasElement) {
      this.localKnovaCanvasRef = canvasElement
    },

    startSelection() {
      this.targetRect = this.screenshotTargetArea.getBoundingClientRect()
      const parentOfTarget = this.screenshotTargetArea.parentNode

      this.isSelecting = true
      this.selectionBox = document.createElement('div')
      this.selectionBox.id = 'screenshot-selection-box'
      this.selectionBox.style.position = 'absolute'
      this.selectionBox.style.border = '2px dashed #FF0000'
      this.selectionBox.style.pointerEvents = 'none'
      this.selectionBox.style.zIndex = '9999'
      this.selectionBox.style.width = '0px'
      this.selectionBox.style.height = '0px'
      this.selectionBox.style.boxSizing = 'border-box'

      // 将选区框绝对定位在目标容器内部，这样它的坐标计算就简单了
      this.selectionBox.style.left = '0'
      this.selectionBox.style.top = '0'
      this.selectionBox.style.display = 'none'

      parentOfTarget.appendChild(this.selectionBox)

      window.addEventListener('mousedown', this.onMouseDown)
      window.addEventListener('mousemove', this.onMouseMove)
      window.addEventListener('mouseup', this.onMouseUp)
    },

    onMouseDown(e) {
      if (!this.isSelecting) return
      e.preventDefault()
      this.selectionBox.style.display = 'block'
      const x = e.clientX
      const y = e.clientY
      this.selectionStart = { x, y }
      this.selectionEnd = { ...this.selectionStart }
      this.updateSelectionBox()
    },

    onMouseMove(e) {
      if (!this.isSelecting || !this.selectionStart.x) return
      const x = e.clientX
      const y = e.clientY
      this.selectionEnd = { x, y }
      this.updateSelectionBox()
    },

    onMouseUp(e) {
      if (!this.isSelecting) return

      const x = Math.min(this.selectionStart.x, this.selectionEnd.x)
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y )
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      if (width > 5 && height > 5) {
        this.captureScreenshot(x, y, width, height, this.selectionBox)
      }

      this.cancelSelection()
    },

    updateSelectionBox() {
      const x = Math.min(this.selectionStart.x, this.selectionEnd.x)
      const y = Math.min(this.selectionStart.y, this.selectionEnd.y)
      const width = Math.abs(this.selectionEnd.x - this.selectionStart.x)
      const height = Math.abs(this.selectionEnd.y - this.selectionStart.y)

      this.selectionBox.style.left = `${x}px`
      this.selectionBox.style.top = `${y}px`
      this.selectionBox.style.width = `${width}px`
      this.selectionBox.style.height = `${height}px`
    },

    cancelSelection() {
      window.removeEventListener('mousedown', this.onMouseDown)
      window.removeEventListener('mousemove', this.onMouseMove)
      window.removeEventListener('mouseup', this.onMouseUp)

      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox)
      }
      this.selectionBox = null
      this.isSelecting = false
    },

    /**
     * --- 最终完美版截图逻辑 ---
     * 结合了 Konva 快照和直接截图目标容器，并正确处理了坐标。
     */
    async captureScreenshot(targetX, targetY, targetWidth, targetHeight, selectionBoxElement) {
      try {
        // 1. 创建一个临时 Konva 画布来合成所有内容
        // 这个画布的大小就是我们最终要生成的图片的大小
        const canvasKonva = document.createElement('canvas')
        canvasKonva.width = targetWidth
        canvasKonva.height = targetHeight
        const ctxKonva = canvasKonva.getContext('2d')

        // 2. **获取 Konva 的内容**
        const konvaImageUrl = await this.localKnovaCanvasRef.toDataURL({
          pixelRatio: 1,
        })
        const konvaImage = new Image()
        konvaImage.src = konvaImageUrl

        // 3. 在等待 Konva 图片加载时，使用 html2canvas 截取目标区域的背景和其他元素
        // 注意：这里的 screenshotTargetArea 是截图指令的源，而不是截图结果的尺寸
        const htmlCanvas = await html2canvas(this.screenshotTargetArea, {
          // **关键：启用 CORS**
          useCORS: true,
          allowTaint: true, // 允许被污染的 Canvas 参与到截图
          logging: false,
          // **关键：只截选中的区域**
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight,
          scale: 1,
        })

        // 4. 两个 canvas 都准备好了，现在开始合成
        // 先绘制 html2canvas 的结果（背景、SVG、其他div等）
        ctxKonva.drawImage(htmlCanvas, 0, 0)

        // 再绘制 Konva 的图片，并正确对齐
        // x 是在 screenshotTargetArea 内部的偏移，所以 Konva 的图片也要相应偏移
        ctxKonva.drawImage(konvaImage, targetX, targetY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight)

        // 5. 处理最终结果（放置、美化、下载）
        if (selectionBoxElement.parentNode) {
          selectionBoxElement.parentNode.removeChild(selectionBoxElement)
        }

        // 4. 下载混合后的最终画布
        canvasKonva.toBlob((blob) => {
          const fileObject = new File([blob], '审核.png', { type: 'image/png' })
          console.log(`02 fileObject`, fileObject)
          console.log(`82 blob`, blob)
          const url = URL.createObjectURL(blob)
          // const a = document.createElement('a')
          // a.href = url
          // a.download = 'threejs-knova-screenshot.png'
          // document.body.appendChild(a)
          // a.click()
          // document.body.removeChild(a)
          // URL.revokeObjectURL(url)
          this.$mitt.emit('mClipboardPhotoDone', fileObject)
        }, 'image/png')

        // 将我们合成的 canvas 转换为 URL 用于下载和显示
        const finalImageUrl = canvasKonva.toDataURL('image/png')
        const finalImageElement = document.createElement('img')
        finalImageElement.src = finalImageUrl
        finalImageElement.style.position = 'fixed'
        finalImageElement.style.top = '10px'
        finalImageElement.style.left = '10px'
        finalImageElement.style.border = '3px solid purple'
        finalImageElement.style.zIndex = '10001'
        document.body.appendChild(finalImageElement)
        setTimeout(() => finalImageElement.remove(), 3000)

        document.body.appendChild(finalImageElement)
        this.selectionBox = finalImageElement // 更新引用，方便清理
        this.$emit('toggleControls', true)
      } catch (error) {
        this.cancelSelection()
      }
    },
  },
}
</script>

<style>
#screenshot-selection-box {
  background-color: rgba(255, 0, 0, 0.1);
}
</style>
