<template>
  <div>
    <!-- <button @click="startSelection">选择区域截图</button> -->
    <div ref="container" class="three-container"></div>
    <ClipboardPhoto
      :scene="scene"
      :container="$refs.container"
      :renderer="renderer"
      ref="clipboardPhotoRef"
    ></ClipboardPhoto>
  </div>
</template>
<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import ClipboardPhoto from '@/views/form/clipboardPhoto.vue'

export default {
  name: 'ThreeScene',
  components: {
    ClipboardPhoto,
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      cube: null,
      controls: null,
      animationId: null,
      // 新增截图相关状态
      isSelecting: false,
      selectionStart: { x: 0, y: 0 },
      selectionEnd: { x: 0, y: 0 },
      selectionBox: null,
    }
  },
  mounted() {
    this.initThree()
    this.animate()
  },
  beforeDestroy() {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('mousedown', this.onMouseDown) // 清理事件
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.cleanupThree()
  },
  methods: {
    cleanupThree() {
      // 清除场景
      if (this.scene) {
        while (this.scene.children.length) {
          const object = this.scene.children[0]
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose())
            } else {
              object.material.dispose()
            }
          }
          this.scene.remove(object)
        }
      }

      // 清除渲染器
      if (this.renderer) {
        this.renderer.dispose()
        if (this.renderer.domElement) {
          this.renderer.domElement = null
        }
      }

      // 清除控制器
      if (this.controls) {
        this.controls.dispose()
        this.controls = null
      }
    },
    animate() {
      this.animationId = requestAnimationFrame(this.animate)

      if (this.cube) {
        this.cube.rotation.x += 0.01
        this.cube.rotation.y += 0.01
      }

      if (this.controls) {
        this.controls.update()
      }

      this.renderer.render(this.scene, this.camera)
    },
    initThree() {
      // 初始化场景
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x000000)

      // 初始化相机
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.container.clientWidth / this.$refs.container.clientHeight,
        0.1,
        1000,
      )
      this.camera.position.z = 5

      // 初始化渲染器, 允许读取像素数据
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true, // 关键修复！允许读取像素数据
      })
      this.renderer.setSize(this.$refs.container.clientWidth, this.$refs.container.clientHeight)
      this.$refs.container.appendChild(this.renderer.domElement)

      // 初始化控制器 - 使用正确的 OrbitControls 构造函数
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.25

      // 添加测试立方体
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      this.cube = new THREE.Mesh(geometry, material)
      this.scene.add(this.cube)

      // 添加光源
      const light = new THREE.AmbientLight(0xffffff, 0.5)
      this.scene.add(light)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(1, 1, 1)
      this.scene.add(directionalLight)

      // 窗口大小变化事件
      window.addEventListener('resize', this.onWindowResize)
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
      this.$refs.container.appendChild(this.selectionBox)

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

    testImg() {},

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
<style scoped>
.three-container {
  width: 100%;
  height: calc(100vh - 50px);
}
</style>
