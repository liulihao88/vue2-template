<template>
  <div ref="container" class="three-container"></div>
</template>

<script>
import * as THREE from 'three';
// 使用新版 OrbitControls 导入方式
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
  name: 'ThreeScene',
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      cube: null,
      controls: null,
      animationId: null
    };
  },
  mounted() {
    this.initThree();
    this.animate();
  },
  beforeDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize);
    this.cleanupThree();
  },
  methods: {
    initThree() {
      // 初始化场景
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);

      // 初始化相机
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.container.clientWidth / this.$refs.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 5;

      // 初始化渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(
        this.$refs.container.clientWidth,
        this.$refs.container.clientHeight
      );
      this.$refs.container.appendChild(this.renderer.domElement);

      // 初始化控制器 - 使用正确的 OrbitControls 构造函数
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;

      // 添加测试立方体
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      this.cube = new THREE.Mesh(geometry, material);
      this.scene.add(this.cube);

      // 添加光源
      const light = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(light);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);

      // 窗口大小变化事件
      window.addEventListener('resize', this.onWindowResize);
    },
    onWindowResize() {
      this.camera.aspect =
        this.$refs.container.clientWidth / this.$refs.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        this.$refs.container.clientWidth,
        this.$refs.container.clientHeight
      );
    },
    animate() {
      this.animationId = requestAnimationFrame(this.animate);

      if (this.cube) {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
      }

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    },
    cleanupThree() {
      // 清除场景
      if (this.scene) {
        while (this.scene.children.length) {
          const object = this.scene.children[0];
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
          this.scene.remove(object);
        }
      }

      // 清除渲染器
      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement) {
          this.renderer.domElement = null;
        }
      }

      // 清除控制器
      if (this.controls) {
        this.controls.dispose();
        this.controls = null;
      }
    }
  }
};
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 400px;
}
</style>
