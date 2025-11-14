<template>
  <div class="model-viewer">
    <div class="upload-area">
      <!-- <el-button class="open-glb" type="primary" size="small" @click="triggerFileInput">打开 GLB 文件</el-button> -->
      <!-- <input ref="fileInput" type="file" accept=".glb" @change="handleFileUpload" style="display: none" /> -->
    </div>
    <GlbSelect v-model="selectUrl" @change="selectChange"></GlbSelect>

    <el-dialog
      :visible.sync="modelLoaded"
      :title="hoverCoordsTitle"
      append-to-body
      :close-on-click-modal="false"
      fullscreen
      custom-class="dark-theme-dialog">
      <div ref="allContainerRef" class="all-container">
        <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
        <template v-if="modelLoaded">
          <el-progress
            :percentage="percentage"
            v-if="!isLoaded"
            class="progress-box"
            color="#333"
            :style-width="20"></el-progress>
          <absolute-box
            :customStyle="{
              left: 0,
              top: 'calc(0% + 56px)',
              height: 'calc(50vh - 56px)',
            }"
            :rightStyle="{
              right: 0,
            }"
            title="全部构件">
            <template #right>
              {{ sendNodes.length }}=
              <div class="input-black-box">
                <el-input
                  placeholder="请输入内容"
                  v-model.trim="searchValue"
                  size="small"
                  style="width: 200px"
                  @clear="handleSearch"
                  :clearable="true">
                  <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                </el-input>
              </div>
            </template>
            <div class="node-tree" ref="scrollWrapperRef" v-if="sendNodes.length > 0">
              <node-item
                v-for="node in sendNodes"
                :key="node.uuid"
                :node="node"
                :depth="0"
                :selected-id="selectedNodeId"
                @node-select="handleNodeSelect" />

              <IoLoadMore style="height: 10px" @loadSuccess="loadSuccess" :pageSize="pageSize" ref="ioLoadMoreRef">
                加载啊
              </IoLoadMore>
              <div v-if="emptyShow" class="no-more">暂无更多数据</div>
            </div>
            <div v-else class="no-more no-data">暂无数据</div>
          </absolute-box>
          <cus-dialog @close="closeCusDialog('statistics')" title="模型信息" v-show="isShowStatistics">
            <div v-for="(part, i) in partLists" :key="part.id" class="part-item" w>
              <div>{{ part.name }}: {{ materialMeshMap.get(part.id).length }}个</div>
            </div>
          </cus-dialog>
          <cus-dialog @close="closeCusDialog('mouse')" title="鼠标捕获" v-show="isShowMouse">
            <div>
              <div>当前坐标</div>
              <div style="margin-top: 8px" v-if="hoverCoords.visible">
                <span style="margin-right: 8px">x: {{ hoverCoords.x }}</span>
                <span style="margin-right: 8px">y: {{ hoverCoords.y }}</span>
                <span style="margin-right: 8px">z: {{ hoverCoords.z }}</span>
              </div>
            </div>
          </cus-dialog>

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
import CusDialog from './components/cusDialog.vue'
import IoLoadMore from './components/ioLoadMore.vue'
import GlbSelect from './components/glbSelect.vue'

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
    CusDialog,
    IoLoadMore,
    GlbSelect,
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
    sceneNodes(val) {
      if (val && val.length > 0) {
        // 修改这里，确保设置的是 allSceneNodes
        this.allSceneNodes = val.slice(0) // 保存原始树的根节点
        // 初始的 sendNodes 还是取前 pageSize 个
        this.sendNodes = val[0].children.slice(0, this.pageSize)
      }
    },
  },
  data() {
    return {
      searchValue: '',
      emptyShow: false,
      pageSize: 30,
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
      isShowMouse: false,
      sceneNodes: [],
      sendNodes: [],
      allSceneNodes: [],
      filteredSceneNodes: {},
      highlightMaterial: null,
      // selectUrl: '3.glb',
      selectUrl: '2.glb',
    }
  },
  created() {
    this.$mitt.on('mittClipboard', this.mittClipboard)
  },
  async mounted() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance', // 添加此选项
      stencil: false,
      depth: true,
      // 添加以下属性提升清晰度
      alpha: true,
      logarithmicDepthBuffer: true, // 对于大场景有助于深度精度
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
    selectChange() {
      this.loadModel()
    },
    reduceQuality() {
      // 动态降低质量以提高性能
      this.renderer.antialias = true // 启用抗锯齿 设为false为禁用抗锯齿
      this.renderer.shadowMap.enabled = false // 禁用阴影（如果不需要的话）
      console.log(`46 window.devicePixelRatio`, window.devicePixelRatio)
      this.renderer.setPixelRatio(1) // 限制像素比率
      this.controls.enableDamping = false // 禁用阻尼效果
      this.controls.dampingFactor = 0 // 禁用阻尼效果
      this.controls.rotateSpeed = 1.0 // 适当调整旋转速度
      this.controls.zoomSpeed = 1.2
      this.controls.panSpeed = 0.8
      this.camera.frustumCulled = true // 启用视锥体剔除
    },
    // 2. 新增 handleSearch 方法
    handleSearch() {
      this.$refs.ioLoadMoreRef?.reset?.()
      if (this.$refs.scrollWrapperRef) {
        // 使用 el-scrollbar 的 update 方法来刷新，然后设置 scrollTop
        this.$refs.scrollWrapperRef.scrollTop = 0 // 也可以尝试这种方式
      }
      // 如果搜索框为空，显示所有节点
      if (!this.searchValue) {
        this.filteredSceneNodes = {}
        this.sendNodes = this.allSceneNodes[0]?.children?.slice(0, this.pageSize) ?? []
        return
      }
      this.filteredSceneNodes = {
        [this.searchValue.toLowerCase()]: this.filterNodes(this.allSceneNodes, this.searchValue.toLowerCase()),
      }
      // 这里我们简单截取，符合你现有的分页逻辑
      this.sendNodes =
        this.filteredSceneNodes[this.searchValue.toLowerCase()][0]?.children?.slice(0, this.pageSize) ?? []

      this.judgeEmptyShow()
    },
    judgeEmptyShow() {
      let sNodesLength = this.sendNodes.length
      let sValue = this.searchValue.toLowerCase()
      console.log(`26 sValue`, sValue)
      if (!sValue) {
        this.emptyShow = false
      }
      let filteredLength = this.filteredSceneNodes[sValue]?.[0]?.children?.length
      console.log(`88 filteredLength`, filteredLength)
      if (sNodesLength === filteredLength) {
        this.emptyShow = true
      } else {
        this.emptyShow = false
      }
    },
    filterNodes(nodes, searchTerm) {
      // nodes 是我们要过滤的节点数组
      const result = []

      for (const node of nodes) {
        // 递归检查当前节点的所有子节点
        const matchingChildren = this.filterNodes(node.children, searchTerm)

        // 如果当前节点本身匹配，或者它有任何匹配的子节点，则保留该节点
        if (node.name.toLowerCase().includes(searchTerm) || matchingChildren.length > 0) {
          // 创建一个节点副本，避免修改原始数据
          const nodeCopy = { ...node }
          // 如果是保留了父节点但父节点本身不匹配，可以将它的 name 或其他信息标记一下，便于UI展示
          // 例如: if (!node.name.toLowerCase().includes(searchTerm)) { nodeCopy.name = '...'; }

          // 将匹配的子节点赋给副本
          nodeCopy.children = matchingChildren
          result.push(nodeCopy)
        }
      }

      return result
    },
    async loadSuccess(sendPageNumber) {
      let pageNumber = sendPageNumber
      // handleSuccess()
      if (this.searchValue) {
        let getFilteredSceneNodes = this.filteredSceneNodes[this.searchValue.toLowerCase()]
        if (!getFilteredSceneNodes) {
          this.handleSearch()
          pageNumber = 1
          await this.$nextTick()
        } else {
          this.sendNodes = this.sendNodes.concat(
            this.filteredSceneNodes[this.searchValue.toLowerCase()][0].children.slice(
              (pageNumber - 1) * this.pageSize,
              pageNumber * this.pageSize,
            ),
          )
        }
      } else {
        if (Object.keys(this.filteredSceneNodes).length !== 0) {
          this.$refs.ioLoadMoreRef?.reset?.()
          this.handleSearch()
          pageNumber = 1
          await this.$nextTick()
        } else {
          this.sendNodes = this.sendNodes.concat(
            this.allSceneNodes[0].children.slice((pageNumber - 1) * this.pageSize, pageNumber * this.pageSize),
          )
        }
      }
      this.judgeEmptyShow()
    },
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
        this.renderer.domElement.addEventListener('mousemove', this.getMouseXYZ, { passive: true })
      } else {
        this.isShowMouse = false
        this.renderer.domElement.removeEventListener('mousemove', this.getMouseXYZ)
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
        // dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        dracoLoader.setDecoderPath('/draco/')
        dracoLoader.setDecoderConfig({ type: 'js' })
        return dracoLoader
      }
      return null
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
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

      // 增强环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
      this.scene.add(ambientLight)

      // 增强主方向光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2) // 提高方向光强度
      directionalLight.position.set(10, 20, 15) // 调整光源位置
      directionalLight.castShadow = true
      this.scene.add(directionalLight)

      // 添加辅助光源以减少阴影
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight2.position.set(-10, -10, -10)
      this.scene.add(directionalLight2)

      // 添加顶部光源
      const topLight = new THREE.DirectionalLight(0xffffff, 0.8)
      topLight.position.set(0, 20, 0)
      this.scene.add(topLight)

      this.renderer.setSize(container.clientWidth, container.clientHeight)
      container.appendChild(this.renderer.domElement)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)

      // 切换到 mousedown
      this.renderer.domElement.addEventListener('mousedown', this.onMouseDownHandler, { passive: true })
      // 添加 mousemove 来检测是否开始拖动
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveHandler, { passive: true })
      // 使用 window 监听 mouseup，确保万无一失
      window.addEventListener('mouseup', this.onMouseUpHandler, { passive: true })
      window.addEventListener('resize', this.onWindowResize)
      // this.reduceQuality()
    },

    async loadModel() {
      this.isLoaded = false
      this.percentage = 0
      const loader = new GLTFLoader()
      const dracoLoader = await this.initDracoLoader()
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader)
      }
      if (this.model && this.scene) {
        // 从场景中移除
        this.scene.remove(this.model)
        // 遍历旧模型的所有子对象，并释放几何体和材质
        this.model.traverse((child) => {
          if (child.isMesh) {
            // 释放几何体
            child.geometry?.dispose()
            // 释放材质
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
        this.model = null // 将旧模型引用置为 null
      }
      loader.load(
        this.selectUrl,
        // '/3.glb',
        // '/4.glb',
        // '/6.glb',
        (gltf) => {
          // 简化几何体
          // gltf.scene.traverse((child) => {
          //   if (child.isMesh) {
          //     console.log(`54 THREE`, THREE)
          //     // 合并顶点以减少内存占用
          //     child.geometry = THREE.BufferGeometryUtils.mergeVertices(child.geometry)

          //     // 计算法线（如果缺失）
          //     if (!child.geometry.attributes.normal) {
          //       child.geometry.computeVertexNormals()
          //     }
          //   }
          // })
          this.partLists = []
          this.isLoaded = true
          this.sceneNodes = []
          this.nodeMap.clear()
          this.meshNodeMap.clear()

          // Apply initial rotation
          this.model = gltf.scene
          this.scene.add(this.model)

          // Build node tree structure
          this.buildNodeTree(this.model.children[0])
          console.log(`34 this.model.children[0]`, this.model.children[0])

          // Prepare for interaction
          this.prepareModelForInteraction(this.model)
          this.fitCameraToModel()
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
        this.allSceneNodes = this.sceneNodes
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

    createHighlightMaterial() {
      if (!this.highlightMaterial) {
        this.highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.7,
          wireframe: false,
          depthTest: true,
          depthWrite: true,
          side: THREE.DoubleSide, // 双面渲染确保可见性
        })
      }
      return this.highlightMaterial
    },
    highlightMeshes(meshes) {
      this.clearHighlight()

      const highlightMat = this.createHighlightMaterial()

      meshes.forEach((mesh) => {
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material
        }
        mesh.material = highlightMat // 使用同一个静态材质实例！
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

      // 节流处理，避免频繁点击检测
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout)
      }

      this.clickTimeout = setTimeout(() => {
        // 计算鼠标位置
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // 只检测可选择的对象
        this.raycaster.setFromCamera(this.mouse, this.camera)

        // 创建一个专门用于交互检测的对象数组，而不是遍历整个场景
        const selectableObjects = []
        this.model.traverse((obj) => {
          if (obj.userData.selectable) {
            selectableObjects.push(obj)
          }
        })

        const intersects = this.raycaster.intersectObjects(selectableObjects, true)

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
            const node = this.nodeMap.get(mesh.uuid) || this.meshNodeMap.get(mesh)
            if (node) {
              this.handleNodeSelect(node)
            }
          }
        } else {
          this.clearHighlight()
        }
      }, 50) // 50ms节流
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
      if (!this.model) return

      // 获取模型的包围盒
      const box = new THREE.Box3().setFromObject(this.model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // 计算合适的距离
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = this.camera.fov * (Math.PI / 180)
      let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      distance *= 1.5 // 增加边距

      // 45度俯视角度
      const angle = 45 * (Math.PI / 180) // 转换为弧度
      const height = distance * Math.sin(angle) // Y轴高度
      const depth = distance * Math.cos(angle) // Z轴距离

      // 设置相机位置（从斜上方观察）
      this.camera.position.set(0, height, depth)
      this.camera.lookAt(center.x, center.y, center.z)
      this.camera.up.set(0, 1, 0) // 标准的上方向

      // 更新控制器
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

    animate() {
      let lastTime = 0
      const render = (time) => {
        // 使用时间戳控制渲染频率，避免过度渲染
        if (time - lastTime > 16) {
          // 约60fps
          if (this.controls && this.controls.enabled) {
            this.controls.update()
          }

          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera)
          }
          lastTime = time
        }

        requestAnimationFrame(render)
      }

      render()
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
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      // 2. 更新光线投射器，使其从相机出发，穿过鼠标点
      this.raycaster.setFromCamera(this.mouse, this.camera)
      // 3. 选择要进行碰撞检测的对象
      // 为了性能，最好只让需要交互的物体参与检测。
      // 例如，如果你的场景很大，可以先找出所有参与交互的 mesh。
      // 如果模型结构不复杂，直接检测整个场景也可以。
      const intersects = this.raycaster.intersectObjects(this.scene.children, true)
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
/* 在现有样式中添加以下内容 */
.all-container {
  width: 100vw !important;
  height: 100vh !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  pointer-events: none; /* 不拦截事件 */
  > * {
    pointer-events: auto; /* 子元素恢复事件处理 */
  }
}
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
  background: #000000;
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
  z-index: 1;
  width: 200px;
}
.part-item {
  height: 30px;
  line-height: 30px;
  padding: 2px;
  color: #4fc3f7;
}
.input-black-box ::v-deep .el-input {
  .el-input__inner {
    background-color: #000;
    border-color: #3b4453;
    height: 25px;
    line-height: 25px;
    color: #fff;
    border-right: none;
  }
  .el-input__icon {
    line-height: 25px;
  }
}
.input-black-box ::v-deep .el-input-group__append {
  background-color: #000;
  border-color: #3b4453;
  /* border-left: none; */
  border-left: none;
  i {
    color: #fff;
  }
}
.no-more {
  text-align: center;
  color: #909399;
  font-size: 14px;
}
.no-data {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
