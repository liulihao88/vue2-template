<template>
  <div>
    ===={{ this.percentage }}??
    <div id="canvas-container2"></div>
    <el-progress
      :percentage="percentage"
      v-if="!isLoaded"
      class="progress-box"
      color="#333"
      :style-width="20"></el-progress>
  </div>
</template>

<script>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
export default {
  name: 'T5',
  components: {},
  props: {},
  data() {
    return {
      // scene: '',
      model: '',
      camera: '',
      percentage: 0,
      isLoaded: false,
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    this.init()
  },
  methods: {
    async initDracoLoader() {
      if (process.env.NODE_ENV === 'development') {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        return dracoLoader
      }
      return null
    },
    async init() {
      this.isLoaded = false
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f0f0) // 设置一个浅灰色背景
      // 2. 初始化相机
      // 透视相机 (PerspectiveCamera)
      // 参数：视野角度(fov), 宽高比, 近裁剪面, 远裁剪面
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

      // 3. 初始化渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true }) // antialias 开启抗锯齿
      renderer.setSize(window.innerWidth, window.innerHeight) // 设置渲染器大小为窗口大小
      document.getElementById('canvas-container2').appendChild(renderer.domElement) // 将渲染器的 canvas 元素添加到 HTML 中
      // 4. 添加轨道控制器
      const controls = new OrbitControls(this.camera, renderer.domElement)
      controls.enableDamping = true // 启用阻尼（惯性），使控制更平滑
      controls.dampingFactor = 0.05
      // 5. 添加灯光（非常重要！没有灯光，模型会是一片漆黑）
      // 环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      // 平行光（模拟太阳光）
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 20, 15) // 设置灯光位置
      scene.add(directionalLight)
      // 6. 使用 GLTFLoader 加载模型
      const loader = new GLTFLoader()
      const dracoLoader = await this.initDracoLoader()
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader)
      }
      console.log(`17 loader`, loader)
      // loader.load 的三个参数：
      // 1. 模型文件的路径
      // 2. 加载成功后的回调函数
      // 3. 加载进度回调函数 (可选)
      // 4. 加载失败后的回调函数 (可选)
      let modelUrl = '/1.glb'
      //  modelUrl = '/2.glb'
      //  modelUrl = '/3.glb'
      // modelUrl = 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf'
      loader.load(
        // 模型路径 (根据你的项目结构调整)
        modelUrl,
        (gltf) => {
          console.log(`08 gltf`, gltf)
          this.isLoaded = true
          console.log(`86 this.isLoaded`, this.isLoaded)
          // gltf 对象包含了整个模型的所有信息
          // gltf.scene 是一个包含模型、相机、灯光等的 Object3D
          this.model = gltf.scene
          // **重要**：将模型居中并缩放到一个合适的大小
          // 这个步骤非常关键，因为从其他软件导出的模型，其原点和尺寸可能不适合直接使用
          this.model.position.set(0, 0, 0) // 将模型原点移动到场景中心
          this.model.scale.set(1, 1, 1) // 缩放模型
          this.fitCameraToModel()

          // 将加载的模型添加到场景中
          scene.add(this.model)
          console.log('模型加载成功！', gltf)
          // 如果模型包含动画
          // gltf.animations 是一个包含所有 Clip 对象的数组
          // const mixer = new THREE.AnimationMixer(model);
          // const action = mixer.clipAction(gltf.animations[0]);
          // action.play();
          const animate = () => {
            requestAnimationFrame(animate) // 请求下一帧，形成循环
            controls.update() // 更新控制器（如果启用了阻尼）
            renderer.render(scene, this.camera) // 使用当前的场景和相机进行渲染
          }
          animate() // 启动这个循环
        },

        // 加载进度回调
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% 已加载')
          console.log(`46  parseInt((xhr.loaded / xhr.total) * 100)`,  parseInt((xhr.loaded / xhr.total) * 100));
          let num = parseInt((xhr.loaded / xhr.total) * 100)
          console.log(`41 num`, num);
          this.percentage = num
        },

        // 加载失败回调
        (error) => {
          console.error('模型加载过程中发生错误:', error)
        },
      )
    },
    fitCameraToModel() {
      // a. 获取模型的边界框
      this.camera.position.set(0, 2, 5) // 将相机放在 x=0, y=1, z=5 的位置
      const box = new THREE.Box3().setFromObject(this.model)
      const center = box.getCenter(new THREE.Vector3())
      console.log(`12 center`, center)
      const size = box.getSize(new THREE.Vector3())
      console.log(`36 size`, size)

      const maxDim = Math.max(size.x, size.y, size.z)
      console.log(`34 maxDim`, maxDim)
      const targetScale = 4.0 / maxDim
      console.log(`04 targetScale`, targetScale)

      // c. 计算缩放比例
      // 我们希望模型最大为 4 个单位，可以根据需要调整这个 '4.0'
      this.model.scale.multiplyScalar(targetScale)
      // d. 将模型居中 (使其中心位于世界坐标原点)
      this.model.position.sub(center.multiplyScalar(targetScale))
      // --- 核心逻辑结束 ---
      // 将处理好的模型添加到场景中
    },
  },
}
</script>
<style scoped lang="scss">
body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#canvas-container2 {
  // width: 30%;
  // height: 100%;
}
.progress-box {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 200px;
}
</style>
