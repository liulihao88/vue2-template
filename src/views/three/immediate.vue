<template>
  <div>
    <div>你好啊</div>
    <div id="canvas-container2"></div>
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
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f0f0) // 设置一个浅灰色背景
      // 2. 初始化相机
      // 透视相机 (PerspectiveCamera)
      // 参数：视野角度(fov), 宽高比, 近裁剪面, 远裁剪面
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.set(0, 1, 5) // 将相机放在 x=0, y=1, z=5 的位置
      // 3. 初始化渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true }) // antialias 开启抗锯齿
      renderer.setSize(window.innerWidth, window.innerHeight) // 设置渲染器大小为窗口大小
      // renderer.setPixelRatio(window.devicePixelRatio) // 考虑设备像素比，在高分辨率屏幕上更清晰
      // renderer.outputEncoding = THREE.sRGBEncoding // sRGB 编码，颜色更准确
      // console.log(`92 document.getElementById('canvas-container2')`, document.getElementById('canvas-container2'))
      document.getElementById('canvas-container2').appendChild(renderer.domElement) // 将渲染器的 canvas 元素添加到 HTML 中
      // 4. 添加轨道控制器
      const controls = new OrbitControls(camera, renderer.domElement)
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
      const modelUrl = '/2.glb'
      loader.load(
        // 模型路径 (根据你的项目结构调整)
        // '../../../public/2.glb?' + new Date().getTime(),
        modelUrl,
        (gltf) => {
          console.log(`08 gltf`, gltf)
          // gltf 对象包含了整个模型的所有信息
          // gltf.scene 是一个包含模型、相机、灯光等的 Object3D
          const model = gltf.scene
          // **重要**：将模型居中并缩放到一个合适的大小
          // 这个步骤非常关键，因为从其他软件导出的模型，其原点和尺寸可能不适合直接使用
          model.position.set(0, 0, 0) // 将模型原点移动到场景中心
          model.scale.set(1, 1, 1) // 缩放模型
          // 你也可以使用 Three.js 的辅助函数自动居中并缩放
          // const box = new THREE.Box3().setFromObject(model);
          // const center = box.getCenter(new THREE.Vector3());
          // const size = box.getSize(new THREE.Vector3());
          // const maxDim = Math.max(size.x, size.y, size.z);
          // const scale = 2 / maxDim; // 缩放到一个合适的尺寸
          // model.position.sub(center);
          // model.scale.set(scale, scale, scale);
          // 将加载的模型添加到场景中
          scene.add(model)
          console.log('模型加载成功！', gltf)
          // 如果模型包含动画
          // gltf.animations 是一个包含所有 Clip 对象的数组
          // const mixer = new THREE.AnimationMixer(model);
          // const action = mixer.clipAction(gltf.animations[0]);
          // action.play();
          const animate = () => {
            requestAnimationFrame(animate) // 请求下一帧，形成循环
            controls.update() // 更新控制器（如果启用了阻尼）
            renderer.render(scene, camera) // 使用当前的场景和相机进行渲染
          }
          animate() // 启动这个循环
        },

        // 加载进度回调
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% 已加载')
        },

        // 加载失败回调
        (error) => {
          console.error('模型加载过程中发生错误:', error)
        },
      )
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
  width: 100%;
  height: 100%;
}
</style>
