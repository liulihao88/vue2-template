<template>
  <div class="model-viewer">
    <!-- <div class="upload-area">
      <el-button
        class="open-glb to-left"
        type="primary"
        size="small"
        @click="setTopView"
        >切换俯视图</el-button
      >
      <el-input-number v-model="testDuration.x" class="open-glb to-left1" />
      <el-input-number v-model="testDuration.y" class="open-glb to-left2" />
      <el-input-number v-model="testDuration.z" class="open-glb to-left3" />
    </div> -->

    <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
    <template v-if="modelLoaded">
      <el-select
        v-model="activeModelUrl"
        placeholder="请选择标准名称"
        popper-class="dark-select-dropdown"
        @change="loadModel()"
        class="top-select">
        <el-option
          v-for="item in relaInfo"
          :key="item.filePath"
          :label="item.filePath"
          :value="item.filePath">
        </el-option>
      </el-select>

      <absolute-box
        :customStyle="{
          left: 0,
          top: '55px'
        }"
        title="部位属性">
        <div
          v-for="(part, i) in partLists"
          :key="part.id"
          :class="{
            active: selectedPartId === part.id
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
      <div v-if="showDetails">
        <TableBlack
          ref="tableBlackRef"
          :baseInfo="baseInfo"
          @handleTableClose="handleTableClose">
        </TableBlack>
      </div>
    </template>

    <BottomThreeBtn
      v-if="modelLoaded"
      @reviewHandler="reviewHandler"
      @clipboardHandler="clipboardHandler"
      @resetModel="resetModel()"></BottomThreeBtn>
    <ClipboardPhoto
      :scene="scene"
      :renderer="renderer"
      @toggleControls="toggleControls"
      :container="$refs.sceneContainer"
      ref="clipboardPhotoRef"></ClipboardPhoto>
  </div>
</template>

<script>
import * as THREE from 'three'
import ElementAttribute from './components/elementAttribute.vue'
import TableBlack from './components/tableBlack.vue'

import BottomThreeBtn from './components/bottomThreeBtn.vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import ClipboardPhoto from './components/clipboardPhoto.vue'
import absoluteBox from './components/absoluteBox.vue'
import { getOneById } from './api'

export default {
  name: 'ModelViewer',
  components: {
    BottomThreeBtn,
    ClipboardPhoto,
    TableBlack,
    ElementAttribute,

    absoluteBox
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
        z: 0
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

      relaInfo: [],
      baseInfo: {},
      currentModel: '',
      activeModelUrl: '',
      dracoLoader: '',
      loader: '',
      showDetails: false,
      isActive: '',
      pointer: ''
    }
  },
  created() {
    // this.open()
  },
  async mounted() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true // 关键修复！允许读取像素数据
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
    // 加载模型方法
    async loadModel() {
      await this.$nextTick()
      this.showDetails = false
      this.loading = true

      try {
        // 释放旧模型
        if (this.currentModel) {
          await this.cleanupScene(this.currentModel)
        }
        console.log(`48 this.activeModelUrl`, this.activeModelUrl)
        let fullUrl = window.location.origin + this.activeModelUrl
        console.log(`13 fullUrl`, fullUrl)
        // 加载新模型
        const gltf = await this.loader.loadAsync(fullUrl)

        this.currentModel = gltf.scene

        this.partLists = []

        this.model = gltf.scene
        // ✅ 为所有部件添加点击事件
        this.model.traverse(obj => {
          if (obj.isMesh) {
            const matId = obj.material.id
            // 建立材质与Mesh的映射
            if (!this.materialMeshMap.has(matId)) {
              this.materialMeshMap.set(matId, [])
              // let cloneMaterial = clone(obj.material)
              this.partLists.push({
                // 去重部件列表
                name: obj.material.name || `部件_${matId}`,
                id: matId
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
      } catch (error) {
        console.error('模型加载失败:', error)
        this.$message.error('模型加载失败')
      } finally {
        this.loading = false
      }
    },
    async open(row) {
      let res = await getOneById(row.id)
      if (res.data.code == 0) {
        this.baseInfo = res.data.data?.baseInfo
        this.relaInfo = res.data.data.relaInfo
        this.modelLoaded = true
        await this.initScene()
        await this.$nextTick()
        this.activeModelUrl = this.relaInfo[0].filePath
        this.loadModel()
      }
    },
    toggleControls(bool) {
      this.controls.enabled = bool
      if (bool) {
        this.isActive = ''
      }
    },
    clipboardHandler() {
      this.isActive = 'clipboard'
      this.$refs.clipboardPhotoRef.startSelection()
    },

    async initScene() {
      await this.$nextTick()

      const container = this.$refs.sceneContainer
      if (container.clientWidth === 0) {
        // 临时强制显示容器
        container.style.display = 'block'
        container.style.display = '' // 恢复原始状态
      }
      this.cleanupScene()
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x000000)

      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.sceneContainer.clientWidth /
          this.$refs.sceneContainer.clientHeight,
        0.1,
        1000
      )

      // 光源设置
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 20, 0)
      this.scene.add(directionalLight)

      this.renderer.setSize(
        this.$refs.sceneContainer.clientWidth,
        this.$refs.sceneContainer.clientHeight
      )
      this.renderer.shadowMap.enabled = true

      this.$refs.sceneContainer.appendChild(this.renderer.domElement)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true

      // 6. 加载器（带DRACO压缩支持）
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath(
        'https://www.gstatic.com/draco/v1/decoders/'
      )
      this.loader = new GLTFLoader()
      this.loader.setDRACOLoader(this.dracoLoader)

      // 添加事件监听
      this.renderer.domElement.addEventListener(
        'pointerdown',
        this.onPointerDown
      )
      this.renderer.domElement.addEventListener(
        'pointermove',
        this.onPointerMove
      )
      window.addEventListener('resize', this.onWindowResize)

      // 在 mounted 或 initScene 方法中加入调试代码：
      console.log('DOM容器:', this.$refs.sceneContainer)
      console.log('渲染器DOM:', this.renderer.domElement)

      // ✅ 添加射线检测
      this.raycaster = new THREE.Raycaster()
      this.pointer = new THREE.Vector2()

      // 监听canvas点击事件
      this.renderer.domElement.addEventListener('click', event => {
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
            event
          })
        } else {
          this.resetScene() // 点击空白处重置选择
        }
      })
    },
    async reviewHandler() {
      this.showDetails = true
      await this.$nextTick()
      this.$refs.tableBlackRef.init()
    },
    handleTableClose() {
      console.log(`03 this.showDetails`, this.showDetails)
      this.showDetails = false
    },

    setupClickHandler() {
      const container = this.$refs.sceneContainer
      const mouse = new THREE.Vector2()

      container.addEventListener('click', event => {
        // 计算鼠标标准化坐标
        const rect = container.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // 执行射线检测
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(
          this.model.children,
          true
        )
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
      this.selectedPartMesh = part
      let partId = part.id
      // 清除旧高亮
      this.clearHighlights()

      // 获取该材质对应的所有Mesh
      const meshes = this.materialMeshMap.get(partId) || []

      // 批量高亮
      meshes.forEach(mesh => {
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
          wireframe: false
        })
      }
      return this._highlightMaterial
    },
    // 清除所有高亮
    clearHighlights() {
      this.highlightedMeshes.forEach(mesh => {
        if (mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial
        }
      })
      this.highlightedMeshes.clear()
    },

    handlePartClick(event, obj) {
      console.log(`75 event`, event)
      console.log(`29 obj`, obj)
      const userData = obj.userData
      if (userData) {
        console.log('英文名:', userData.name_en) // 可能字段
        console.log('中文名:', userData.name_cn)
        console.log('材质类型:', userData.material_type)
      }

      console.log(`obj.material.id`, obj.material.id)
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
      model.traverse(child => {
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
        distance * 0.5 // 倾斜量
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

    onWindowResize() {
      if (this.$refs.sceneContainer && this.camera && this.renderer) {
        this.camera.aspect =
          this.$refs.sceneContainer.clientWidth /
          this.$refs.sceneContainer.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(
          this.$refs.sceneContainer.clientWidth,
          this.$refs.sceneContainer.clientHeight
        )
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
        console.log(
          `99 this.selectedPartMesh.material`,
          this.selectedPartMesh.material
        )
        this.selectedPartMesh.material.opacity =
          0.5 + 0.3 * Math.sin(Date.now() * 0.005)
      }
    },
    onPointerDown(event) {
      event.preventDefault()

      // 计算标准化指针位置 [-1, 1]
      const rect = this.$refs.sceneContainer.getBoundingClientRect()
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 设置标记表示正在拖动
      this.isDragging = true

      // 检查是否点击了模型
      this.raycaster.setFromCamera(this.pointer, this.camera)
      const intersects = this.raycaster.intersectObjects(
        this.model ? [this.model] : [],
        true
      )
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object

        // 在移动前保存当前模型状态以进行比较
        this.dragStartPosition = {
          pointer: this.pointer.clone(),
          cameraPosition: this.camera.position.clone(),
          cameraQuaternion: this.camera.quaternion.clone()
        }

        // 如果有选中对象，停止动画
        if (this.selectedPartMesh) {
          this.selectedPartMesh.material.opacity = 0.7
        }
      } else {
        // 点击空白处清除选中
        this.resetScene()
      }
    },
    onPointerMove(event) {
      if (!this.isDragging || !this.model) return

      // 计算当前指针位置
      const rect = this.$refs.sceneContainer.getBoundingClientRect()
      const currentPointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )

      if (this.dragStartPosition) {
        // 计算指针移动增量
        const deltaX = currentPointer.x - this.dragStartPosition.pointer.x
        const deltaY = currentPointer.y - this.dragStartPosition.pointer.y

        // 根据移动量旋转模型
        this.model.rotation.y =
          this.dragStartPosition.modelRotationY + deltaX * Math.PI
        this.model.rotation.x =
          this.dragStartPosition.modelRotationX + deltaY * Math.PI

        // 限制X轴旋转角度 (-PI/2 到 PI/2)
        this.model.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.model.rotation.x)
        )
      }

      // 射线检测并高亮悬停的对象
      this.raycaster.setFromCamera(currentPointer, this.camera)
      const intersects = this.raycaster.intersectObjects(
        this.model ? [this.model] : [],
        true
      )

      // 高亮悬停对象
      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object
        if (hoveredObject !== this.intersectedObject) {
          // 恢复之前高亮对象的材质
          if (
            this.intersectedObject &&
            this.intersectedObject.userData.originalMaterial
          ) {
            this.intersectedObject.material =
              this.intersectedObject.userData.originalMaterial
          }

          // 高亮新对象
          if (hoveredObject.userData.originalMaterial) {
            hoveredObject.userData.hoverMaterial =
              hoveredObject.userData.hoverMaterial ||
              new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.5
              })
            hoveredObject.material = hoveredObject.userData.hoverMaterial
          }

          this.intersectedObject = hoveredObject
        }
      } else if (this.intersectedObject) {
        // 没有悬停对象时恢复之前高亮的对象
        if (this.intersectedObject.userData.originalMaterial) {
          this.intersectedObject.material =
            this.intersectedObject.userData.originalMaterial
        }
        this.intersectedObject = null
      }
    },

    cleanupScene() {
      if (this.renderer?.domElement) {
        this.renderer.domElement.removeEventListener(
          'pointerdown',
          this.onPointerDown
        )
        this.renderer.domElement.removeEventListener(
          'pointermove',
          this.onPointerMove
        )
      }
      window.removeEventListener('resize', this.onWindowResize)

      if (this.model && this.scene) {
        this.scene.remove(this.model)
        this.model.traverse(child => {
          if (child.isMesh) {
            child.geometry?.dispose()
            if (child.material) {
              Array.isArray(child.material)
                ? child.material.forEach(m => m.dispose())
                : child.material.dispose()
            }
          }
        })
        this.model = null
      }

      if (this.controls) {
        this.controls.dispose()
        this.controls = null
      }
    }
  }
}
</script>

<style scoped lang="scss">
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
.top-select {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 300px;
}
.top-select ::v-deep .el-input--suffix .el-input__inner {
  padding-right: 30px;
  background: #000;
  color: #fff;
}
</style>
