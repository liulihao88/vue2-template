<template>
  <div class="model-viewer">
    <div class="upload-area">
      <el-button class="open-glb" type="primary" size="small" @click="triggerFileInput">打开 GLB 文件</el-button>
      <!-- <el-button class="open-glb to-left" type="primary" size="small" @click="setTopView">切换俯视图</el-button>
      <el-input-number v-model="testDuration.x" class="open-glb to-left1" />
      <el-input-number v-model="testDuration.y" class="open-glb to-left2" />
      <el-input-number v-model="testDuration.z" class="open-glb to-left3" /> -->
      <input ref="fileInput" type="file" accept=".glb" @change="handleFileUpload" style="display: none" />
    </div>

    <el-dialog
      :visible.sync="modelLoaded"
      title="我要变黑色"
      append-to-body
      :close-on-click-modal="false"
      fullscreen
      custom-class="dark-theme-dialog">
      <div>
        <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
        <template v-if="modelLoaded">
          <absolute-box
            :customStyle="{
              left: 0,
              top: 'calc(0% + 56px)',
              height: 'calc(50vh - 56px)',
            }"
            title="部位属性">
            <div class="node-tree">
              <node-item
                v-for="node in sceneNodes"
                :key="node.uuid"
                :node="node"
                :depth="0"
                :selected-id="selectedNodeId"
                @node-select="handleNodeSelect" />
            </div>
          </absolute-box>

          <ElementAttribute :attribute="elementAttributeData"></ElementAttribute>
          <template v-if="isShowReview">
            <TableBlack @closeReview="closeReview"></TableBlack>
            <UploadFile ref="uploadFileRef"></UploadFile>
          </template>
        </template>

        <BottomThreeBtn
          v-if="modelLoaded"
          @resetModel="resetModel()"
          @toggleCLick="toggleClick"
          :activeArr="activeArr"></BottomThreeBtn>
        <ClipboardPhoto
          :scene="scene"
          :knovaCanvasRef="knovaCanvasRef"
          :renderer="renderer"
          @toggleControls="toggleControls"
          :container="$refs.sceneContainer"
          ref="clipboardPhotoRef"></ClipboardPhoto>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { clone } from '@/utils/gFunc'
import Vue from 'vue'
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
import NodeItem from './components/NodeItem.vue' // New component for rendering tree nodes

export default {
  name: 'ModelViewer',
  components: {
    BottomThreeBtn,
    ClipboardPhoto,
    TableBlack,
    ElementAttribute,
    UploadFile,
    absoluteBox,
    NodeItem,
  },
  computed: {
    knovaCanvasRef() {
      // 从最外层开始，一步一步判断，确保每一步都存在
      const uploadFileComp = this.$refs.uploadFileRef
      console.log(`75 uploadFileComp`, uploadFileComp)
      if (!uploadFileComp) return null
      const drawThreeComp = uploadFileComp.$refs.drawThreeRef
      console.log(`69 drawThreeComp`, drawThreeComp)
      if (!drawThreeComp) return null
      console.log(`58 drawThreeComp.$refs.containerRef`, drawThreeComp.$refs.containerRef)
      return drawThreeComp.$refs.containerRef
    },
  },
  data() {
    return {
      modelLoaded: true,
      scene: null,
      camera: null,
      renderer: null,
      testDuration: {
        x: 0,
        y: 0,
        z: 0,
      },
      controls: null,
      model: null,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),

      // Node tree data
      sceneNodes: [],
      selectedNode: null,
      selectedNodeId: null,
      highlightedObjects: new Set(),
      elementAttributeData: {},

      // Other state
      activeArr: [],
      isShowReview: false,
      nodeMap: new Map(), // Maps UUID to node objects
      meshNodeMap: new Map(), // Maps Mesh objects to their containing nodes
      isCurrentlyDragging: false,
    }
  },
  async mounted() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.animate()

    this.$nextTick(() => {
      if (this.$refs.sceneContainer) {
        this.$refs.sceneContainer.appendChild(this.renderer.domElement)
      }
    })
    await this.initScene()
    await this.loadModel()
  },
  beforeDestroy() {
    this.cleanupScene()
  },
  methods: {
    closeReview() {
      this.isShowReview = false
    },
    toggleControls(bool) {
      this.controls.enabled = bool
      if (bool) {
        this.activeArr = this.activeArr.filter((v) => v !== 'clipboard')
      } else {
      }
    },
    toggleClick(arr) {
      if (arr.includes('clipboard')) {
        this.$refs.clipboardPhotoRef.startSelection()
      }
      if (arr.includes('review')) {
        this.isShowReview = true
      } else {
        this.isShowReview = false
      }
      this.activeArr = arr
    },
    async initDracoLoader() {
      if (process.env.NODE_ENV === 'development') {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        return dracoLoader
      }
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
        container.style.display = 'block'
        const width = container.clientWidth
        const height = container.clientHeight
        container.style.display = ''
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

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 20, 0)
      this.scene.add(directionalLight)

      this.renderer.setSize(container.clientWidth, container.clientHeight)
      this.renderer.shadowMap.enabled = true
      container.appendChild(this.renderer.domElement)
      this.renderer.setPixelRatio(1.0)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true

      // 切换到 mousedown
      this.renderer.domElement.addEventListener('mousedown', this.onMouseDownHandler, { passive: true })
      // 添加 mousemove 来检测是否开始拖动
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveHandler, { passive: true })
      // 使用 window 监听 mouseup，确保万无一失
      window.addEventListener('mouseup', this.onMouseUpHandler, { passive: true })
      window.addEventListener('resize', this.onWindowResize)
    },

    async loadModel() {
      const loader = new GLTFLoader()
      const dracoLoader = await this.initDracoLoader()
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader)
      }
      loader.load('/2.glb', (gltf) => {
        this.sceneNodes = []
        this.nodeMap.clear()
        this.meshNodeMap.clear()

        // Apply initial rotation
        gltf.scene.rotation.y = Math.PI
        this.model = gltf.scene
        this.scene.add(this.model)

        // Build node tree structure
        this.buildNodeTree(this.model)

        // Prepare for interaction
        this.prepareModelForInteraction(this.model)
        this.fitCameraToModel()
      })
    },

    buildNodeTree(object, parentNode = null, depth = 0) {
      if (!object || object.type === 'Camera' || object.type === 'Light') return

      const node = {
        uuid: object.uuid,
        name: object.name || `Node_${object.type}`,
        type: object.type,
        visible: object.visible,
        isMesh: object.isMesh,
        userData: object.userData,
        children: [],
      }

      // Store in maps
      this.nodeMap.set(object.uuid, node)
      if (object.isMesh) {
        this.meshNodeMap.set(object, node)
      }

      if (parentNode) {
        parentNode.children.push(node)
      } else {
        this.sceneNodes.push(node)
      }
      // Recursively process children
      if (object.children && object.children.length > 0) {
        object.children.forEach((child) => {
          this.buildNodeTree(child, node, depth + 1)
        })
      }
    },

    handleNodeSelect(node) {
      if (this.selectedNodeId === node.uuid) {
        // this.clearHighlight()
        // this.resetModel()
        return
      }
      this.elementAttributeData = node.userData
      this.selectedNode = node

      // 查找所有相关mesh
      const meshes = []
      this.findMeshes(node, meshes)

      if (meshes.length > 0) {
        this.highlightMeshes(meshes)
        this.focusOnSelection(meshes) // 新增：聚焦选中部位
        this.selectedNodeId = node.uuid
      }
    },

    // 新增方法：聚焦选中部位
    focusOnSelection(meshes) {
      // 创建包含所有选中mesh的包围盒
      const box = new THREE.Box3()

      meshes.forEach((mesh) => {
        mesh.updateMatrixWorld() // 确保世界矩阵是最新的
        const meshBox = new THREE.Box3().setFromObject(mesh)
        box.union(meshBox) // 合并所有包围盒
      })
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // 计算最佳观察距离
      const maxDim = Math.max(size.x, size.y, size.z)
      const distance = maxDim * 1.5

      // 计算从当前相机位置到目标中心的向量
      const direction = new THREE.Vector3()
        .subVectors(this.camera.position, center)
        .normalize()
        .multiplyScalar(distance)

      const targetPosition = new THREE.Vector3().addVectors(center, direction)

      // 创建动画
      const startPosition = this.camera.position.clone()
      const startTarget = this.controls.target.clone()
      const duration = 300 // 1秒动画

      const startTime = Date.now()

      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / duration, 1)

        // 使用缓动函数让移动更平滑
        const easeT = this.easeOutQuad(t)

        this.camera.position.lerpVectors(startPosition, targetPosition, easeT)
        this.controls.target.lerpVectors(startTarget, center, easeT)
        this.controls.update()

        if (t < 1) {
          requestAnimationFrame(animateCamera)
        }
      }

      animateCamera()
    },
    // 缓动函数
    easeOutQuad(t) {
      return t * (2 - t)
    },
    // 更新findMeshes方法
    findMeshes(node, result) {
      // 查找模型中的对应物体
      this.model.traverse((obj) => {
        if (obj.uuid === node.uuid) {
          if (obj.isMesh) {
            result.push(obj)
          }
          // 如果是组/空节点，收集所有子mesh
          else {
            obj.children.forEach((child) => {
              if (child.isMesh) result.push(child)
            })
          }
        }
      })
      // 递归查找子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach((childNode) => {
          this.findMeshes(childNode, result)
        })
      }
    },
    highlightMeshes(meshes) {
      this.clearHighlight()

      meshes.forEach((mesh) => {
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material
        }

        if (!this.highlightMaterial) {
          this.highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7,
            wireframe: false,
          })
        }

        mesh.material = this.highlightMaterial
        this.highlightedObjects.add(mesh)
      })
    },

    highlightNode(node) {
      this.clearHighlight()

      // Find the corresponding Three.js object from the scene
      this.model.traverse((obj) => {
        if (obj.uuid === node.uuid && obj.isMesh) {
          this.highlightMesh(obj)
        }
      })

      // If this is a group node, find all child meshes
      if (node.children && node.children.length > 0) {
        node.children.forEach((childNode) => {
          this.highlightNode(childNode)
        })
      }
    },

    highlightMesh(mesh) {
      if (!mesh) return

      // Store original material and apply highlight
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material
      }

      // Create highlight material if not exists
      if (!this.highlightMaterial) {
        this.highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.8,
          wireframe: false,
        })
      }

      mesh.material = this.highlightMaterial
      this.highlightedObjects.add(mesh)
    },

    clearHighlight() {
      this.highlightedObjects.forEach((mesh) => {
        if (mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial
        }
      })
      this.highlightedObjects.clear()
      this.selectedNodeId = null
      this.selectedNode = null
    },

    onCanvasClick(event) {
      if (!this.model) return

      // Calculate mouse position in normalized device coordinates
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast to find intersections
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObject(this.model, true)

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object

        // Find the nearest mesh (might be child of a group)
        let mesh = clickedObject
        while (mesh && !mesh.isMesh) {
          if (mesh.parent) {
            mesh = mesh.parent
          } else {
            break
          }
        }

        if (mesh && mesh.isMesh) {
          // Find the corresponding node in our tree
          const node = this.nodeMap.get(mesh.uuid) || this.meshNodeMap.get(mesh)
          if (node) {
            this.handleNodeSelect(node)
            // 滚动到对应的树节点
            this.$nextTick(() => {
              const nodeElement = document.querySelector(`[data-node-id="${node.uuid}"]`)
              if (nodeElement) {
              }
              this.findClosestBySelector(nodeElement)
              // console.log(`14 res`, res)
              // res.style.display = 'block'
              setTimeout(() => {
                nodeElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                })
              }, 200)
              this.$nextTick(() => {})
            })
          }
        }
      } else {
        this.clearHighlight()
      }
    },

    // 遍历祖先节点, 如果祖先节点没有展开, 那就展开
    findClosestBySelector(element) {
      // 如果元素本身就匹配
      if (element.classList.contains('not-expanded')) {
        return element
      }
      // 循环向上查找，直到到达 document 元素
      let currentElement = element.parentNode
      while (currentElement && currentElement !== document) {
        if (currentElement.classList.contains('not-expanded')) {
          let preSiblings = currentElement.previousElementSibling
          const expandToggleSpan = preSiblings.querySelector('.expand-toggle')
          if (expandToggleSpan) {
            // 3. 在该子元素上直接调用 click() 方法
            expandToggleSpan.click()
          }
          // currentElement.style.display = 'block'
        }
        currentElement = currentElement.parentNode
      }
      // 如果没找到，返回 null
      return null
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

      const maxDim = Math.max(size.x, size.y, size.z)
      const distance = maxDim * 2

      this.camera.position.set(0, center.y + distance * 0.8, distance * 0.5)
      this.camera.lookAt(center)

      if (this.controls) {
        this.controls.target.copy(center)
        this.controls.update()
      }
    },

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
      this.controls.update()
    },

    animate() {
      requestAnimationFrame(this.animate)
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }

      // Pulsing animation for highlighted objects
      if (this.highlightedObjects.size > 0 && this.highlightMaterial) {
        const pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.005)
        this.highlightMaterial.opacity = pulse
      }
    },
    async resetModel(isFirst = false) {
      // 1. 恢复模型的初始位置/旋转/缩放
      if (this.model) {
        this.model.position.set(0, 0, 0) // 重置位置
        this.model.rotation.set(0, 0, 0) // 重置旋转
        this.model.scale.set(1, 1, 1) // 恢复原始大小
      }
      this.selectedNodeId = ''
      if (!isFirst) {
        // 3. 清除所有选中和高亮状态
        this.clearHighlight()
        // 4. 重新适应模型到视图
        this.fitCameraToModel()
      }
    },

    onMouseDownHandler(event) {
      // 标记为“尚未拖动”
      this.isCurrentlyDragging = false
    },
    // 鼠标移动时，检查并标记为“正在拖动”
    onMouseMoveHandler(event) {
      // 如果 isCurrentlyDragging 已经是 true，就没必要再检查了
      if (this.isCurrentlyDragging) {
        return
      }
      // 任何微小的移动都表示用户意图是拖动，而不是点击
      // 我们可以设置一个非常小的阈值，比如移动超过 2-3 像素就算作拖动
      const threshold = 3 // 像素

      // 获取鼠标上一次的位置（我们需要在 data 中存储这个值）
      if (!this.lastMousePos) {
        this.lastMousePos = { x: event.clientX, y: event.clientY }
        return
      }
      const deltaX = Math.abs(event.clientX - this.lastMousePos.x)
      const deltaY = Math.abs(event.clientY - this.lastMousePos.y)
      if (deltaX > threshold || deltaY > threshold) {
        this.isCurrentlyDragging = true
        this.lastMousePos = { x: event.clientX, y: event.clientY } // 更新位置
      }
    },
    // 鼠标松开时，根据 isCurrentlyDragging 标志决定是否触发点击
    onMouseUpHandler(event) {
      if (this.$refs.uploadFileRef?.isShowDraw) {
        return
      }
      // 恢复 OrbitControls 的旋转能力
      this.controls.enableRotate = true

      // 重置鼠标位置记录
      this.lastMousePos = null
      // 关键判断：如果没拖动，就执行点击
      if (!this.isCurrentlyDragging) {
        // 这就是你的原始点击事件处理逻辑，保持不变！
        this.onCanvasClick(event)
      }

      // 无论是否拖动，最后都重置拖动状态，为下一次点击做准备
      this.isCurrentlyDragging = false
    },

    cleanupScene() {
      // Remove event listeners
      if (this.renderer) {
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownHandler)
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveHandler)
      }
      window.removeEventListener('mouseup', this.onMouseUpHandler)
      window.removeEventListener('resize', this.onWindowResize)

      // Dispose of scene objects
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

      // Clean up highlight material
      if (this.highlightMaterial) {
        this.highlightMaterial.dispose()
        this.highlightMaterial = null
      }

      // Clear controls
      if (this.controls) {
        this.controls.dispose()
        this.controls = null
      }

      // Clear state
      this.sceneNodes = []
      this.nodeMap.clear()
      this.meshNodeMap.clear()
      this.highlightedObjects.clear()
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
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.scene-container {
  position: fixed; /* 关键！相对于视口定位 */
  top: 56px;
  left: 300px;
  width: calc(100% - 600px);
  height: calc(100vh - 56px);
  background: #000;
}

.node-tree {
  padding: 10px;
}

.node-item {
  margin-left: 16px;
}

.node-tree {
  padding: 10px;
  max-height: 70vh;
  overflow-y: auto;
}
.node-tree::-webkit-scrollbar {
  width: 6px;
}
.node-tree::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}
.node-tree::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.node-tree::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
/* 确保模型容器可以接收鼠标事件 */
.scene-container {
  pointer-events: auto !important;
}
</style>
