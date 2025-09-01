<template>
  <div class="model-viewer">
    {{ modelLoaded }}
    <div class="upload-area">
      <button class="upload-btn" @click="triggerFileInput">打开 GLB 文件</button>
      <input ref="fileInput" type="file" accept=".glb" @change="handleFileUpload" style="display: none" />
    </div>

    <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { sleep } from '@/utils/gFunc'

export default {
  name: 'ModelViewer',
  data() {
    return {
      modelLoaded: false,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      model: null,
      selectedPart: null,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      intersectedObject: null,
      originalMaterials: new WeakMap(),
    }
  },
  async mounted() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.animate()

    // 预创建场景容器
    this.$nextTick(() => {
      if (this.$refs.sceneContainer) {
        this.$refs.sceneContainer.appendChild(this.renderer.domElement)
      }
    })
  },
  beforeDestroy() {
    this.cleanupScene()
  },
  methods: {
    async initDracoLoader() {
      // 仅在开发环境下加载本地DRACO库（生产环境建议使用CDN）
      if (process.env.NODE_ENV === 'development') {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        return dracoLoader
      }

      // 生产环境默认使用three.js内置的DRACO支持
      return null
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      try {
        this.modelLoaded = true
        await this.$nextTick()
        const arrayBuffer = await this.readFileAsArrayBuffer(file)
        await this.initScene()
        await this.loadModel(arrayBuffer)
      } catch (error) {
        console.error('加载模型出错:', error)
        alert('模型加载失败: ' + error.message)
      }
    },

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(new Error('文件读取失败'))
        reader.readAsArrayBuffer(file)
      })
    },

    async initScene() {
      await this.$nextTick()

      const container = this.$refs.sceneContainer
      if (container.clientWidth === 0) {
        // 临时强制显示容器
        container.style.display = 'block'
        const width = container.clientWidth
        const height = container.clientHeight
        container.style.display = '' // 恢复原始状态
      }
      this.cleanupScene()
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0xdddddd)

      this.camera = new THREE.PerspectiveCamera(
        60,
        this.$refs.sceneContainer.clientWidth / this.$refs.sceneContainer.clientHeight,
        0.1,
        1000,
      )
      this.camera.position.set(0, 5, 10)

      // 光源设置
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 20, 0)
      this.scene.add(directionalLight)

      // console.log(`15 his.$refs.sceneContainer.clientWidth`, this.$refs.sceneContainer.clientWidth);
      // console.log(`56 this.$refs.sceneContainer.clientHeight`, this.$refs.sceneContainer.clientHeight);
      // this.renderer.setSize(this.$refs.sceneContainer.clientWidth, this.$refs.sceneContainer.clientHeight);
      this.renderer.setSize(500, 500)
      this.renderer.shadowMap.enabled = true

      this.$refs.sceneContainer.appendChild(this.renderer.domElement)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true

      // 添加事件监听
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
      window.addEventListener('resize', this.onWindowResize)

      // 在 mounted 或 initScene 方法中加入调试代码：
      console.log('DOM容器:', this.$refs.sceneContainer)
      console.log('渲染器DOM:', this.renderer.domElement)
    },

    async loadModel(arrayBuffer) {
      const loader = new GLTFLoader()

      // 设置DRACO解码器
      const dracoLoader = await this.initDracoLoader()
      console.log(`66 dracoLoader`, dracoLoader)
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader)
      }

      return new Promise((resolve, reject) => {
        loader.parse(
          arrayBuffer,
          '',
          (gltf) => {
            console.log('模型加载完成', gltf)
            console.log(`82 gltf`, gltf)
            this.model = gltf.scene
            // 打印场景结构
            console.log('场景对象:', this.model)
            this.scene.add(this.model)
            this.prepareModelForInteraction(this.model)
            this.fitCameraToModel()
            // 强制重渲染
            this.renderer.render(this.scene, this.camera)
            resolve()
          },
          (error) => {
            console.error('模型解析错误:', error)
            reject(new Error('GLB文件解析失败'))
          },
        )
      })
    },

    prepareModelForInteraction(model) {
      model.traverse((child) => {
        if (child.isMesh) {
          child.userData.selectable = true
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    },

    fitCameraToModel() {
      const box = new THREE.Box3().setFromObject(this.model)
      const size = box.getSize(new THREE.Vector3()).length()
      const center = box.getCenter(new THREE.Vector3())

      this.controls.target.copy(center)
      this.camera.position.copy(center)
      this.camera.position.z += size * 1.5
      this.controls.update()
    },

    // 以下是交互方法保持不变（onPointerDown, onPointerMove等）
    // ...

    onWindowResize() {
      if (this.$refs.sceneContainer && this.camera && this.renderer) {
        this.camera.aspect = this.$refs.sceneContainer.clientWidth / this.$refs.sceneContainer.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.$refs.sceneContainer.clientWidth, this.$refs.sceneContainer.clientHeight)
      }
    },

    animate() {
      requestAnimationFrame(this.animate)
      if (this.controls) this.controls.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    },

    cleanupScene() {
      if (this.renderer?.domElement) {
        this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
        this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
      }
      window.removeEventListener('resize', this.onWindowResize)

      if (this.model && this.scene) {
        this.scene.remove(this.model)
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose()
            if (child.material) {
              Array.isArray(child.material) ? child.material.forEach((m) => m.dispose()) : child.material.dispose()
            }
          }
        })
        this.model = null
      }

      if (this.controls) {
        this.controls.dispose()
        this.controls = null
      }
    },
  },
}
</script>

<style scoped>
.model-viewer {
  position: relative;
  width: 100vw; /* 或固定宽度 */
  height: 100vh; /* 或固定高度 */
  overflow: hidden; /* 避免滚动条影响 */
}
.scene-container {
  width: 500px !important;
  height: 500px !important;
  background: #000;
}
</style>
