<template>
  <div ref="threeContainer" style="width: 100%; height: 400px"></div>
</template>

<script>
import * as THREE from 'three'
// 按需引入 GLTFLoader（如果是图片，直接用 TextureLoader）
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default {
  mounted() {
    // 1. 初始化 Three.js
    const container = this.$refs.threeContainer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // 2. 添加控制器（允许鼠标拖拽）
    const controls = new OrbitControls(camera, renderer.domElement)

    // 3. 加载后端返回的 URL（示例：GLTF 模型）
    const modelUrl = '你的模型URL' // 替换成后端返回的 URL
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        scene.add(gltf.scene) // 将模型添加到场景
      },
      undefined,
      (error) => {
        console.error('加载失败:', error)
      },
    )

    // 4. 如果是图片，改用这个（取消下面注释）：
    // const imageUrl = "你的图片URL";
    // new THREE.TextureLoader().load(imageUrl, (texture) => {
    //   const geometry = new THREE.PlaneGeometry(5, 5);
    //   const material = new THREE.MeshBasicMaterial({ map: texture });
    //   scene.add(new THREE.Mesh(geometry, material));
    // });

    // 5. 渲染循环
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update() // 仅当需要鼠标交互时启用
      renderer.render(scene, camera)
    }
    animate()

    // 6. 销毁（防止内存泄漏）
    this.$once('hook:beforeDestroy', () => {
      renderer.dispose()
    })
  },
}
</script>
