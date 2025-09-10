<template>
  <div class="model-viewer">
    <div class="upload-area">
      <el-button class="open-glb" type="primary" size="small" @click="triggerFileInput">打开 GLB 文件</el-button>
      <el-button class="open-glb to-left" type="primary" size="small" @click="setTopView">切换俯视图</el-button>
      <el-input-number v-model="testDuration.x" class="open-glb to-left1" />
      <el-input-number v-model="testDuration.y" class="open-glb to-left2" />
      <el-input-number v-model="testDuration.z" class="open-glb to-left3" />
      <input ref="fileInput" type="file" accept=".glb" @change="handleFileUpload" style="display: none" />
    </div>

    <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
    <template v-if="modelLoaded">
      <absolute-box
        :customStyle="{
          left: 0,
          top: '0%',
        }"
        title="部位属性">
        <div
          v-for="(part, i) in partLists"
          :key="part.id"
          :class="{
            active: selectedPartId === part.id,
          }"
          class="part-item"
          @click="onPartListClick(part)">
          <div>
            {{ part.name }}:
            {{ part.id }}
          </div>
        </div>
      </absolute-box>

      <ElementAttribute :attribute="selectedPartMesh"></ElementAttribute>
      <TableBlack></TableBlack>
      <UploadFile></UploadFile>
    </template>

    <BottomThreeBtn
      v-if="modelLoaded"
      @clipboardHandler="clipboardHandler"
      @resetModel="resetModel()"
      :isActive="isActive"></BottomThreeBtn>
    <ClipboardPhoto
      :scene="scene"
      :renderer="renderer"
      @toggleControls="toggleControls"
      :container="$refs.sceneContainer"
      ref="clipboardPhotoRef"></ClipboardPhoto>
  </div>
</template>

<script>
import { clone } from '@/utils/gFunc'
import * as THREE from 'three'
import UploadFile from './components/uploadFile.vue'
import ElementAttribute from './components/elementAttribute.vue'
import TableBlack from './components/tableBlack.vue'
import BottomThreeBtn from './components/bottomThreeBtn.vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import ClipboardPhoto from './components/clipboardPhoto.vue'
import absoluteBox from './components/absoluteBox.vue'

export default {
  name: 'ModelViewer',
  components: {
    BottomThreeBtn,
    ClipboardPhoto,
    TableBlack,
    ElementAttribute,
    UploadFile,
    absoluteBox,
  },
  data() {
    return {
      modelLoaded: false,
      scene: null,
      camera: null,
      renderer: null,
      testDuration: {
        x: 0,
        y: 0,
        z: 0,
      },
      size: {},
      center: {},
      controls: null,
      model: null,
      selectedPart: null,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      intersectedObject: null,
      selectedPartMesh: null,
      originalMaterials: new WeakMap(),
      partLists: [],
      selectedPartId: '',
      materialMeshMap: new Map(), // 材质ID => 对应的Mesh数组
      highlightedMeshes: new Set(),
      _highlightMaterial: '',
      isActive: '',
    }
  },
  async mounted() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // 关键修复！允许读取像素数据
    })
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
    toggleControls(bool) {
      console.log(`19 bool`, bool)
      this.controls.enabled = bool
      if (bool) {
        this.isActive = ''
      }
    },
    clipboardHandler() {
      this.isActive = 'clipboard'
      this.$refs.clipboardPhotoRef.startSelection()
    },
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
      // this.cleanupScene()
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
      this.scene.background = new THREE.Color(0x000000)

      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.sceneContainer.clientWidth / this.$refs.sceneContainer.clientHeight,
        0.1,
        1000,
      )

      // 光源设置
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 20, 0)
      this.scene.add(directionalLight)

      this.renderer.setSize(this.$refs.sceneContainer.clientWidth, this.$refs.sceneContainer.clientHeight)
      this.renderer.shadowMap.enabled = true

      this.$refs.sceneContainer.appendChild(this.renderer.domElement)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      // this.camera.position.set(0.5, 0, 0.866)
      // this.controls.update()

      // 添加事件监听
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
      window.addEventListener('resize', this.onWindowResize)

      // 在 mounted 或 initScene 方法中加入调试代码：
      console.log('DOM容器:', this.$refs.sceneContainer)
      console.log('渲染器DOM:', this.renderer.domElement)

      // ✅ 添加射线检测
      this.raycaster = new THREE.Raycaster()
      this.pointer = new THREE.Vector2()

      // 监听canvas点击事件
      this.renderer.domElement.addEventListener('click', (event) => {
        if (!this.model) return

        // 计算点击位置归一化坐标
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

        // 发射射线检测
        this.raycaster.setFromCamera(this.pointer, this.camera)
        const intersects = this.raycaster.intersectObject(this.model, true)
        console.log(`35 intersects`, intersects)

        if (intersects.length > 0) {
          // 触发mesh的点击事件
          intersects[0].object.dispatchEvent({
            type: 'click',
            event,
          })
        } else {
          this.resetScene() // 点击空白处重置选择
        }
      })
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
            this.partLists = []
            // gltf.scene.rotation.x = -Math.PI / 2 // 如果需要模型躺平
            gltf.scene.rotation.y = Math.PI
            this.model = gltf.scene
            // 打印场景结构
            console.log('场景对象:', this.model)
            // ✅ 为所有部件添加点击事件
            this.model.traverse((obj) => {
              if (obj.isMesh) {
                const matId = obj.material.id
                // 建立材质与Mesh的映射
                if (!this.materialMeshMap.has(matId)) {
                  this.materialMeshMap.set(matId, [])
                  // let cloneMaterial = clone(obj.material)
                  this.partLists.push({
                    // 去重部件列表
                    name: obj.material.name || `部件_${matId}`,
                    id: matId,
                    // ...cloneMaterial,
                  })
                }
                this.materialMeshMap.get(matId).push(obj) // 关联Mesh
                obj.userData.originalMaterial = obj.material // 保存原始材质
              }
            })
            this.scene.add(this.model)
            this.prepareModelForInteraction(this.model)
            this.fitCameraToModel()

            // 设置点击事件监听（在容器上）
            this.setupClickHandler()
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

    setupClickHandler() {
      const container = this.$refs.sceneContainer
      const mouse = new THREE.Vector2()

      container.addEventListener('click', (event) => {
        // 计算鼠标标准化坐标
        const rect = container.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // 执行射线检测
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.model.children, true)
        console.log(`851 intersects`, intersects)

        if (intersects.length > 0) {
          const clickedObj = intersects[0].object
          this.handlePartClick(event, clickedObj)
        }
      })
    },
    // 点击部件列表时的处理
    onPartListClick(part) {
      console.log(`18 part`, part)
      console.log(`this.partLists`, this.partLists)
      this.selectedPartMesh = part
      let partId = part.id
      // 清除旧高亮
      this.clearHighlights()

      // 获取该材质对应的所有Mesh
      const meshes = this.materialMeshMap.get(partId) || []

      // 批量高亮
      meshes.forEach((mesh) => {
        // 保存原始材质（如果尚未保存）
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material
        }

        // 应用高亮材质（共享同一个材质实例提升性能）
        mesh.material = this.getHighlightMaterial()
        this.highlightedMeshes.add(mesh)
      })

      // 更新选中状态
      this.selectedPartId = partId
      console.log(`18 partId`, partId)
      console.log(`46 this.selectedPartId`, this.selectedPartId)
    },
    // 获取/共享高亮材质
    getHighlightMaterial() {
      if (!this._highlightMaterial) {
        this._highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.7,
          wireframe: false,
        })
      }
      return this._highlightMaterial
    },
    // 清除所有高亮
    clearHighlights() {
      this.highlightedMeshes.forEach((mesh) => {
        if (mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial
        }
      })
      this.highlightedMeshes.clear()
    },

    handlePartClick(event, obj) {
      const userData = obj.userData
      // console.log(`04***** obj ***** 389行 three/completeThreePage3.vue  `)
      // console.log(JSON.stringify(obj, null, '\t'))

      console.log(`34 userData`, userData)
      console.log(`19***** userData.originalMaterial ***** 393行 three/completeThreePage3.vue  `)
      console.log(JSON.stringify(userData.originalMaterial, null, '\t'))

      console.log(`86***** obj.material ***** 403行 three/completeThreePage3.vue  `)
      console.log(JSON.stringify(obj.material, null, '\t'))

      this.onPartListClick(obj.material)
    },
    // 在 methods 中添加 resetModel() 方法
    async resetModel(isFirst = false) {
      // 1. 恢复模型的初始位置/旋转/缩放
      if (this.model) {
        this.model.position.set(0, 0, 0) // 重置位置
        this.model.rotation.set(0, 0, 0) // 重置旋转
        this.model.scale.set(1, 1, 1) // 恢复原始大小
      }
      if (!isFirst) {
        // 3. 清除所有选中和高亮状态
        this.resetScene()

        // 4. 重新适应模型到视图
        this.fitCameraToModel()
      }
    },

    resetScene() {
      // 1. 清除所有Mesh的高亮材质
      this.clearHighlights()
      // 2. 清除左侧列表的选中状态
      this.selectedPartId = '' // 设置为空字符串（或 undefined/null）

      // 3. 重置 selectedPartMesh（避免动画继续）
      if (this.selectedPartMesh) {
        this.scene.remove(this.selectedPartMesh)
        this.selectedPartMesh = null
      }
      this.selectedPart = null
      // 4. 移除射线交互的高亮对象
      this.intersectedObject = null // 如果你在用射线交互
      // 可选：强制重渲染一次（如果UI没立即更新）
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
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
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // 计算模型的对角线长度（保证完整包围）
      const maxDim = Math.max(size.x, size.y, size.z)
      console.log(`45 maxDim`, maxDim)
      const distance = maxDim * 2 // 相机距离根据最大尺寸动态调整

      this.camera.position.set(
        0,
        center.y + distance * 0.8, // 高度2倍
        distance * 0.5, // 倾斜量
      )
      this.camera.lookAt(center)

      // 4. 更新控制器（若使用OrbitControls）
      if (this.controls) {
        this.controls.target.copy(center) // 设置控制器焦点
        this.controls.update() // 强制生效
      }
      // 调试输出
      console.log('Model size:', size, 'Camera position:', this.camera.position)
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
    setTopView() {
      const { x, y, z } = this.testDuration
      this.camera.position.set(x, y, z)
      this.camera.lookAt(0, 0, 0)
      this.controls.update() // 强制更新控制器
    },

    animate() {
      requestAnimationFrame(this.animate)
      // if (this.controls) {
      //   this.controls.update()
      // }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
      // 在animate()中添加脉冲动画
      if (this.selectedPartMesh && this.selectedPartMesh.material) {
        console.log(`99 this.selectedPartMesh.material`, this.selectedPartMesh.material)
        this.selectedPartMesh.material.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.005)
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
.open-glb {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
}
.to-left {
  left: 60%;
}
.to-left1 {
  top: 50px;
  left: 30%;
}
.to-left2 {
  top: 50px;
  left: 50%;
}
.to-left3 {
  top: 50px;
  left: 70%;
}
.model-viewer {
  width: 100vw; /* 或固定宽度 */
  height: 100vh; /* 或固定高度 */
  overflow: hidden; /* 避免滚动条影响 */
}
.scene-container {
  width: 100% !important;
  height: 100% !important;
  background: #000;
}
.info-panel {
  position: absolute;
  top: 100px;
  right: 500px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 4px;
  z-index: 100;
}
.part-name {
  margin-bottom: 8px;
}

.scene-container canvas {
  cursor: pointer;
}
.part-item {
  height: 30px;
  line-height: 30px;
  padding: 2px;
}
.active {
  background: yellow;
  color: blue;
}
</style>
