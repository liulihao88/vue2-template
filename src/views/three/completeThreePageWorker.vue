<template>
  <div class="model-viewer">
    <el-dialog
      :visible.sync="modelLoaded"
      :title="hoverCoordsTitle"
      append-to-body
      :close-on-click-modal="false"
      fullscreen
      custom-class="dark-theme-dialog">
      <div ref="allContainerRef">
        <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
        <template v-if="modelLoaded">
          <!-- <el-progress

            :percentage="percentage"
            v-if="!isLoaded"
            class="progress-box"
            color="#333"
            :style-width="20"></el-progress> -->
          <i type="primary" v-if="!isLoaded" class="progress-box el-icon-loading"></i>
          <absolute-box
            :customStyle="{
              left: 0,
              top: 'calc(0% + 56px)',
              height: 'calc(50vh - 56px)',
            }"
            title="全部构件">
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
          <g-cus-dialog @close="closeCusDialog('statistics')" title="模型信息" v-show="isShowStatistics">
            <div v-for="(part, i) in partLists" :key="part.id" class="part-item" w>
              <div>{{ part.name }}: {{ materialMeshMap.get(part.id).length }}个</div>
            </div>
          </g-cus-dialog>
          <g-cus-dialog @close="closeCusDialog('mouse')" title="鼠标捕获" v-show="isShowMouse">
            <div>
              <div>当前坐标</div>
              <div style="margin-top: 8px" v-if="hoverCoords.visible">
                <span style="margin-right: 8px">x: {{ hoverCoords.x }}</span>
                <span style="margin-right: 8px">y: {{ hoverCoords.y }}</span>
                <span style="margin-right: 8px">z: {{ hoverCoords.z }}</span>
              </div>
            </div>
          </g-cus-dialog>

          <ElementAttribute :attribute="elementAttributeData"></ElementAttribute>
          <template v-if="isShowReview">
            <TableBlack @closeReview="closeReview"></TableBlack>
            <UploadFile ref="uploadFileRef"></UploadFile>
          </template>
        </template>

        <BottomThreeBtn
          v-if="modelLoaded"
          @resetModel="resetModel()"
          @toggleClick="toggleClick"
          :activeArr="activeArr"></BottomThreeBtn>
        <ClipboardPhoto
          :scene="scene"
          :knovaCanvasRef="knovaCanvasRef"
          :renderer="renderer"
          :screenshotTargetArea="$refs.allContainerRef"
          @toggleControls="toggleControls"
          :container="$refs.sceneContainer"
          ref="clipboardPhotoRef"></ClipboardPhoto>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as THREE from 'three'
import UploadFile from './components/uploadFile.vue'
import ElementAttribute from './components/elementAttribute.vue'
import TableBlack from './components/tableBlack.vue'
import BottomThreeBtn from './components/bottomThreeBtn.vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import ClipboardPhoto from './components/clipboardPhotoHtml2Canvas.vue'
import absoluteBox from './components/absoluteBox.vue'
import NodeItem from './components/NodeItem.vue' // New component for rendering tree nodes
import ModelParserWorker from './workers/modelParser.worker.js'

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
    hoverCoordsTitle() {
      return 'glb文件'
    },
    knovaCanvasRef() {
      // 从最外层开始，一步一步判断，确保每一步都存在
      const uploadFileComp = this.$refs.uploadFileRef
      if (!uploadFileComp) return null
      const drawThreeComp = uploadFileComp.$refs.drawThreeRef
      if (!drawThreeComp) return null
      return drawThreeComp.$refs.containerRef
    },
  },
  watch: {
    isShowMouse(bool) {
      if (bool) {
        this.renderer.domElement.addEventListener('mousemove', this.getMouseXYZ, { passive: true })
      } else {
        this.renderer.domElement.removeEventListener('mousemove', this.getMouseXYZ, { passive: true })
        this.hoverCoords.visible = false
      }
    },
  },
  data() {
    return {
      worker: null,
      needRender: false,
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
      isLoaded: false,
      percentage: 0,
      isShowStatistics: false,
      partLists: [],
      hoverCoords: {
        visible: false, // 控制信息框的显示/隐藏
        x: 0,
        y: 0,
        z: 0,
      },
      // 为了性能，我们存储 Raycaster 和鼠标向量，避免在函数中重复创建
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      materialMeshMap: new Map(), // 材质ID => 对应的Mesh数组
      allInteractiveMeshes: [],
      isShowMouse: false,
    }
  },
  created() {
    this.$mitt.on('mittClipboard', this.mittClipboard)
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
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.cleanupScene()
    //！！！非常重要！！！
    if (this.worker) {
      this.worker.terminate() // 关闭 Worker，释放资源
      this.worker = null
    }
  },
  methods: {
    mittClipboard() {
      this.$refs.clipboardPhotoRef.startSelection()
    },
    closeReview() {
      this.isShowReview = false
    },
    toggleControls(bool) {
      this.controls.enabled = bool
      if (bool) {
        this.$refs.uploadFileRef.$refs.drawThreeRef.isClipboard = false
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

      if (arr.includes('statistics')) {
        this.isShowStatistics = true
      } else {
        this.isShowStatistics = false
      }
      if (arr.includes('mouse')) {
        this.isShowMouse = true
      } else {
        this.isShowMouse = false
      }
      this.activeArr = arr
    },
    closeCusDialog(type) {
      this.activeArr = this.activeArr.filter((v) => v !== type)
      this.toggleClick(this.activeArr)
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
      // this.controls.addEventListener('change', () => {
      //   // 控制器导致相机变化, 需要重绘
      //   if (this.renderer && this.scene && this.camera) {
      //     this.needRender = true
      //   }
      // })

      const originalUpdate = this.controls.update
      this.controls.update = () => {
        // 先调用 update 原本的功能，更新相机
        originalUpdate.call(this.controls)
        // 然后设置我们的渲染标志
        if (this.renderer && this.scene && this.camera) {
          // 注意，这里我们直接调用 renderer.render，而不是设置标志位了
          // 因为 OrbitControls 的更新已经是一个动画循环，我们只需要在它更新后渲染一次即可
          this.renderer.render(this.scene, this.camera)
        }
      }

      // 切换到 mousedown
      this.renderer.domElement.addEventListener('mousedown', this.onMouseDownHandler, { passive: true })

      // 使用 window 监听 mouseup，确保万无一失
      window.addEventListener('mouseup', this.onMouseUpHandler, { passive: true })
      window.addEventListener('resize', this.onWindowResize)
    },

    async loadModel() {
      this.isLoaded = false
      this.percentage = 0
      const loader = new GLTFLoader()
      const dracoLoader = await this.initDracoLoader()
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader)
      }
      loader.load(
        // '/2.glb',
        '/3.glb',
        async (gltf) => {
          this.partLists = []
          this.isLoaded = true
          this.sceneNodes = []
          this.nodeMap.clear()
          this.meshNodeMap.clear()

          // Apply initial rotation
          this.model = gltf.scene
          this.scene.add(this.model)

          this.model = gltf.scene
          this.scene.add(this.model)
          // --- Worker 集成 ---
          // 确保只在浏览器环境中运行
          if (typeof Worker !== 'undefined') {
            // 动态导入已经返回了 Promise
            this.worker = new ModelParserWorker()

            // 设置 Worker 消息监听器
            this.worker.onmessage = this.handleWorkerMessage
            // 发送模型数据给 Worker
            this.worker.postMessage({ model: this.model.toJSON() })
            // this.worker.postMessage({ model: {name: 'amdy'} })
          } else {
            console.warn('Web Workers not supported, falling back to main thread processing.')
            this.fallbackToMainThreadProcessing()
          }
        }, // 加载进度回调
        (xhr) => {
          this.percentage = parseInt((xhr.loaded / xhr.total) * 100)
        },

        // 加载失败回调
        (error) => {
          console.error('模型加载过程中发生错误:', error)
        },
      )
    },
    fallbackToMainThreadProcessing() {
      // 如果 Worker 不可用或加载失败，降级到主线程处理
      console.warn('Falling back to main thread processing - may lag.')
      this.buildNodeTree(this.model)
      this.allInteractiveMeshes = this.findAllMeshes(this.model) // 自己实现一个查找函数
      this.fitCameraToModel()
      this.isLoaded = true
    },
    findAllMeshes(object, meshes = []) {
      if (object.isMesh) {
        meshes.push(object)
      }
      for (const child of object.children) {
        this.findAllMeshes(child, meshes)
      }
      return meshes
    },
    // --- Worker 事件处理 ---
    handleWorkerMessage(e) {
      console.log(`89 e.data`, e.data)
      console.log(`15 e`, e)
      console.log('Main: Received data from Worker.')
      const { sceneNodes, nodeMap, meshNodeMap, allInteractiveMeshes, materialMeshMap, custom } = e.data
      console.log(`83 custom`, custom)
      console.log(`07 materialMeshMap`, materialMeshMap)
      console.log(`17 allInteractiveMeshes`, allInteractiveMeshes)
      console.log(`88 meshNodeMap`, meshNodeMap)
      console.log(`33 nodeMap`, nodeMap)
      console.log(`38 sceneNodes`, sceneNodes)
      // 更新组件状态
      this.sceneNodes = sceneNodes
      this.nodeMap = new Map(nodeMap)
      this.meshNodeMap = new Map(meshNodeMap)
      this.allInteractiveMeshes = allInteractiveMeshes // 极其重要的优化！
      this.materialMeshMap = new Map(materialMeshMap)
      // 此时，树结构数据已准备好，可以适配相机或进行其他初始化
      this.fitCameraToModel()
      this.isLoaded = true
    },
    fallbackToMainThreadTreeBuilding(model) {
      // 这是你的原始逻辑，作为备用方案
      console.warn('Building tree on main thread. This may cause lag.')
      // ... 原 buildNodeTree, prepareModelForInteraction 等逻辑
      this.prepareModelForInteraction(model)
      this.buildNodeTree(model)
      this.fitCameraToModel()
      this.isLoaded = true
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
      // nodeMap 存储了所有节点对象，我们可以直接用 node.uuid 查找 Three.js 对象
      const threeObject = this.scene.getObjectByProperty('uuid', node.uuid)
      if (!threeObject) {
        return // 没找到，返回
      }
      if (threeObject.isMesh) {
        result.push(threeObject)
      } else if (threeObject.children && threeObject.children.length > 0) {
        threeObject.children.forEach((child) => {
          if (child.isMesh) {
            result.push(child)
          }
        })
      }
      // 递归查找子节点，这部分逻辑是合理的
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

      if (this.renderer && this.scene && this.camera) {
        this.needRender = true
      }
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
      // const intersects = this.raycaster.intersectObject(this.model, true)

      const intersects = this.raycaster.intersectObjects(this.allInteractiveMeshes)
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
              // res.style.display = 'block'
              nodeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
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

          const matId = child.material.id
          // 建立材质与Mesh的映射
          if (!this.materialMeshMap.has(matId)) {
            this.materialMeshMap.set(matId, [])
            // let cloneMaterial = clone(child.material)
            this.partLists.push({
              // 去重部件列表
              name: child.material.name || `部件_${matId}`,
              id: matId,
              // ...cloneMaterial,
            })
          }
          this.materialMeshMap.get(matId).push(child) // 关联Mesh
          child.userData.originalMaterial = child.material // 保存原始材质
        }
      })
    },

    fitCameraToModel() {
      // a. 获取模型的边界框
      this.camera.position.set(0, 2, 5) // 将相机放在 x=0, y=1, z=5 的位置
      const box = new THREE.Box3().setFromObject(this.model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      const maxDim = Math.max(size.x, size.y, size.z)
      const targetScale = 4.0 / maxDim

      // c. 计算缩放比例
      // 我们希望模型最大为 4 个单位，可以根据需要调整这个 '4.0'
      this.model.scale.multiplyScalar(targetScale)
      // d. 将模型居中 (使其中心位于世界坐标原点)
      this.model.position.sub(center.multiplyScalar(targetScale))
      // --- 核心逻辑结束 ---
      // 将处理好的模型添加到场景中

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
      if (this.needRender) {
        this.renderer.render(this.scene, this.camera)
        this.needRender = false
      }
      requestAnimationFrame(this.animate)
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
      this.camera.position.set(0, 2, 5)
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
      // 添加 mousemove 来检测是否开始拖动
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveHandler, { passive: true })
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

    getMouseXYZ() {
      const rect = this.renderer.domElement.getBoundingClientRect()
      console.log(`98 rect`, rect)
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      // 2. 更新光线投射器，使其从相机出发，穿过鼠标点
      this.raycaster.setFromCamera(this.mouse, this.camera)
      // 3. 选择要进行碰撞检测的对象
      let allInteractableMeshes = []
      for (let meshes of this.materialMeshMap.values()) {
        allInteractableMeshes = allInteractableMeshes.concat(meshes)
      }
      // b. 使用这个优化后的数组进行检测
      const intersects = this.raycaster.intersectObjects(allInteractableMeshes, false) // true 改为 false，因为我们提供的是最底层的 Mesh 数组
      // 4. 分析结果
      if (intersects.length > 0) {
        // 获取第一个（也就是最近的）交点信息
        const intersect = intersects[0]

        // --- 关键 ---
        // `intersect.point` 就是鼠标在 3D 空间中指向的那个点的世界坐标！
        // 这是一个 THREE.Vector3 对象
        const point = intersect.point
        // 5. 更新我们的 data，从而更新 UI
        this.hoverCoords = {
          visible: true,
          x: point.x.toFixed(3),
          y: point.y.toFixed(3),
          z: point.z.toFixed(3),
        }
      } else {
        // 如果鼠标没有悬停在任何物体上，则隐藏坐标信息
        this.hoverCoords.visible = false
      }
    },
    // 鼠标松开时，根据 isCurrentlyDragging 标志决定是否触发点击
    onMouseUpHandler(event) {
      console.log(`38 event`, event)
      if (this.$refs.uploadFileRef?.isShowDraw) {
        return
      }
      // 恢复 OrbitControls 的旋转能力
      this.controls.enableRotate = true

      // 重置鼠标位置记录
      this.lastMousePos = null
      // 关键判断：如果没拖动，就执行点击
      if (!this.isCurrentlyDragging) {
        const parent = event.target?.parentNode
        if (!parent) {
          return
        }
        let judgeIsSceneContainer = parent?.classList?.contains('scene-container')
        if (judgeIsSceneContainer) {
          this.onCanvasClick(event)
          // 这就是你的原始点击事件处理逻辑，保持不变！
        }
      }

      // 无论是否拖动，最后都重置拖动状态，为下一次点击做准备
      this.isCurrentlyDragging = false
    },

    cleanupScene() {
      // Remove event listeners
      if (this.renderer) {
        this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownHandler)
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveHandler)
        this.renderer.domElement.removeEventListener('mousemove', this.getMouseXYZ)
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
.progress-box {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 40px;
  z-index: 1;
}
.part-item {
  height: 30px;
  line-height: 30px;
  padding: 2px;
  color: #4fc3f7;
}
</style>
