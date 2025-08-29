<template>
  <div class="model-viewer">
    <div class="upload-area">
      <el-button class="open-glb" type="primary" size="small" @click="triggerFileInput">打开 GLB 文件</el-button>
      <input ref="fileInput" type="file" accept=".glb" @change="handleFileUpload" style="display: none" />
    </div>

    <div ref="sceneContainer" class="scene-container" v-if="modelLoaded"></div>
    <g-absolute-box v-if="modelLoaded">
      <div v-if="selectedPart">
        <div class="part-name">
          选中部件: <strong>{{ selectedPart }}</strong>
        </div>
        <el-button @click="resetScene" type="primary" size="small">取消选择</el-button>

        <div v-if="selectedPartMesh" class="part-meta">
          <div>位置: {{ selectedPartMesh.position.toArray().map((v) => v.toFixed(2)) }}</div>
          <div>uuid: {{ selectedPartMesh.uuid }}</div>
          <div>id: {{ selectedPartMesh.id }}</div>
        </div>
      </div>
    </g-absolute-box>

    <BottomThreeBtn v-if="modelLoaded" @clipboardHandler="clipboardHandler"></BottomThreeBtn>
    <ClipboardPhoto :scene="scene" :renderer="renderer" :container="$refs.sceneContainer" ref="clipboardPhotoRef"></ClipboardPhoto>
  </div>
</template>

<script>
import * as THREE from "three";
import BottomThreeBtn from "@/views/three/bottomThreeBtn.vue";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { sleep } from "@/utils/gFunc";
import ClipboardPhoto from "@/views/form/clipboardPhoto.vue";

export default {
  name: "ModelViewer",
  components: {
    BottomThreeBtn,
    ClipboardPhoto
  },
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
      originalMaterials: new WeakMap()
    };
  },
  async mounted() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true // 关键修复！允许读取像素数据
    });
    this.animate();

    // 预创建场景容器
    this.$nextTick(() => {
      if (this.$refs.sceneContainer) {
        this.$refs.sceneContainer.appendChild(this.renderer.domElement);
      }
    });
  },
  beforeDestroy() {
    this.cleanupScene();
  },
  methods: {
    clipboardHandler() {
      this.$refs.clipboardPhotoRef.startSelection();
    },
    async initDracoLoader() {
      // 仅在开发环境下加载本地DRACO库（生产环境建议使用CDN）
      if (process.env.NODE_ENV === "development") {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        return dracoLoader;
      }

      // 生产环境默认使用three.js内置的DRACO支持
      return null;
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        this.modelLoaded = true;
        await this.$nextTick();
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        await this.initScene();
        await this.loadModel(arrayBuffer);
      } catch (error) {
        console.error("加载模型出错:", error);
        alert("模型加载失败: " + error.message);
      }
    },

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("文件读取失败"));
        reader.readAsArrayBuffer(file);
      });
    },

    async initScene() {
      await this.$nextTick();

      const container = this.$refs.sceneContainer;
      if (container.clientWidth === 0) {
        // 临时强制显示容器
        container.style.display = "block";
        const width = container.clientWidth;
        const height = container.clientHeight;
        container.style.display = ""; // 恢复原始状态
      }
      this.cleanupScene();
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);

      this.camera = new THREE.PerspectiveCamera(90, this.$refs.sceneContainer.clientWidth / this.$refs.sceneContainer.clientHeight, 0.5, 1000);
      this.camera.position.set(0, 5, 10);

      // 光源设置
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 0);
      this.scene.add(directionalLight);

      console.log(`15 his.$refs.sceneContainer.clientWidth`, this.$refs.sceneContainer.clientWidth);
      console.log(`56 this.$refs.sceneContainer.clientHeight`, this.$refs.sceneContainer.clientHeight);
      this.renderer.setSize(this.$refs.sceneContainer.clientWidth, this.$refs.sceneContainer.clientHeight);
      this.renderer.shadowMap.enabled = true;

      this.$refs.sceneContainer.appendChild(this.renderer.domElement);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;

      // 添加事件监听
      this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
      this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("resize", this.onWindowResize);

      // 在 mounted 或 initScene 方法中加入调试代码：
      console.log("DOM容器:", this.$refs.sceneContainer);
      console.log("渲染器DOM:", this.renderer.domElement);

      // ✅ 添加射线检测
      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();

      // 监听canvas点击事件
      this.renderer.domElement.addEventListener("click", (event) => {
        if (!this.model) return;

        // 计算点击位置归一化坐标
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 发射射线检测
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObject(this.model, true);

        if (intersects.length > 0) {
          // 触发mesh的点击事件
          intersects[0].object.dispatchEvent({ type: "click", event });
        } else {
          this.resetScene(); // 点击空白处重置选择
        }
      });
    },

    async loadModel(arrayBuffer) {
      const loader = new GLTFLoader();

      // 设置DRACO解码器
      const dracoLoader = await this.initDracoLoader();
      console.log(`66 dracoLoader`, dracoLoader);
      if (dracoLoader) {
        loader.setDRACOLoader(dracoLoader);
      }

      return new Promise((resolve, reject) => {
        loader.parse(
          arrayBuffer,
          "",
          (gltf) => {
            this.model = gltf.scene;
            // 打印场景结构
            console.log("场景对象:", this.model);
            // ✅ 为所有部件添加点击事件
            this.model.traverse((obj) => {
              if (obj.isMesh) {
                obj.userData.originalMaterial = obj.material; // 保存原始材质
              }
            });
            this.scene.add(this.model);
            this.prepareModelForInteraction(this.model);
            this.fitCameraToModel();

            // 设置点击事件监听（在容器上）
            this.setupClickHandler();
            // 强制重渲染
            this.renderer.render(this.scene, this.camera);

            resolve();
          },
          (error) => {
            console.error("模型解析错误:", error);
            reject(new Error("GLB文件解析失败"));
          }
        );
      });
    },

    setupClickHandler() {
      const container = this.$refs.sceneContainer;
      const mouse = new THREE.Vector2();

      container.addEventListener("click", (event) => {
        // 计算鼠标标准化坐标
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 执行射线检测
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.model.children, true);

        if (intersects.length > 0) {
          const clickedObj = intersects[0].object;
          this.handlePartClick(event, clickedObj);
        }
      });
    },

    handlePartClick(event, obj) {
      // 恢复之前高亮的部分
      if (this.currentHighlight) {
        this.currentHighlight.material = this.currentHighlight.userData.originalMaterial;
      }

      // 高亮当前选中部分
      console.log(`45 obj`, obj);
      this.currentHighlight = obj;
      this.selectedPartMesh = obj; // 保存选中的mesh对象
      obj.material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7,
        wireframe: false
      });

      // 3. 更新显示信息
      this.selectedPart = obj.name || "未命名部件";
      console.log("选中部件:", this.selectedPart);
      console.log("位置信息:", obj.position.toArray());
    },

    resetScene() {
      // 清除选中状态
      if (this.selectedPartMesh) {
        this.scene.remove(this.selectedPartMesh);
        this.selectedPartMesh = null;
      }
      this.selectedPart = null;
    },

    prepareModelForInteraction(model) {
      model.traverse((child) => {
        if (child.isMesh) {
          child.userData.selectable = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    },

    fitCameraToModel() {
      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      this.controls.target.copy(center);
      this.camera.position.copy(center);
      this.camera.position.z += size * 1.5;
      this.controls.update();
    },

    // 以下是交互方法保持不变（onPointerDown, onPointerMove等）
    // ...

    onWindowResize() {
      if (this.$refs.sceneContainer && this.camera && this.renderer) {
        this.camera.aspect = this.$refs.sceneContainer.clientWidth / this.$refs.sceneContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.$refs.sceneContainer.clientWidth, this.$refs.sceneContainer.clientHeight);
      }
    },

    animate() {
      requestAnimationFrame(this.animate);
      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      // 在animate()中添加脉冲动画
      if (this.selectedPartMesh) {
        this.selectedPartMesh.material.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.005);
      }
    },

    cleanupScene() {
      if (this.renderer?.domElement) {
        this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
        this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
      }
      window.removeEventListener("resize", this.onWindowResize);

      if (this.model && this.scene) {
        this.scene.remove(this.model);
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (child.material) {
              Array.isArray(child.material) ? child.material.forEach((m) => m.dispose()) : child.material.dispose();
            }
          }
        });
        this.model = null;
      }

      if (this.controls) {
        this.controls.dispose();
        this.controls = null;
      }
    }
  }
};
</script>

<style scoped>
.open-glb {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
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
</style>
