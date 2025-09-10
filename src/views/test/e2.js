// 全局变量
let scene, camera, renderer, controls, selectedObject = null;
const highlightMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true
});
const originalMaterials = new WeakMap();

// 初始化Three.js场景
function initScene() {
  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // 相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById('scene-container').appendChild(renderer.domElement);

  // 控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // 光源
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // 坐标轴辅助
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // 性能监控
  const stats = new Stats();
  stats.domElement.style.position = 'absolute';
  document.getElementById('stats').appendChild(stats.domElement);

  // 窗口大小调整
  window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth - 300) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 300, window.innerHeight);
  });

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    stats.update();
  }
  animate();
}

// 创建树形UI
function createTreeUI(node, parentElement, depth = 0) {
  const container = document.createElement('div');
  container.className = 'tree-node';

  // 节点名称和属性
  const nodeElement = document.createElement('div');
  nodeElement.textContent = `${node.name || 'unnamed'} (${node.type})`;
  nodeElement.style.paddingLeft = `${depth * 15}px`;
  nodeElement.addEventListener('click', () => highlightNode(node));

  // 如果有子节点，添加折叠/展开按钮
  if (node.children && node.children.length > 0) {
    const caret = document.createElement('span');
    caret.className = 'tree-caret';
    caret.textContent = '▶';
    caret.addEventListener('click', (e) => {
      e.stopPropagation();
      caret.textContent = caret.textContent === '▶' ? '▼' : '▶';
      childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
      container.classList.toggle('expanded');
    });
    nodeElement.prepend(caret);
  }

  container.appendChild(nodeElement);
  parentElement.appendChild(container);

  // 子节点容器
  if (node.children && node.children.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    container.appendChild(childrenContainer);

    // 递归创建子节点
    node.children.forEach(child => {
      createTreeUI(child, childrenContainer, depth + 1);
    });
  }
}

// 高亮选中的节点
function highlightNode(node) {
  // 移除之前的高亮
  if (selectedObject) {
    const materials = originalMaterials.get(selectedObject);
    if (materials) {
      selectedObject.material = materials;
    }
  }

  // 高亮新选中的节点
  selectedObject = node;

  if (node.isMesh) {
    // 保存原始材质
    originalMaterials.set(node, node.material);
    // 应用高亮材质
    node.material = highlightMaterial;

    // 聚焦到选中的对象
    const bbox = new THREE.Box3().setFromObject(node);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2));

    controls.target.copy(center);
    camera.position.copy(center.clone().add(new THREE.Vector3(1, 0.5, 1).normalize().multiplyScalar(distance)));
    controls.update();
  }
}

// 加载GLB文件
function loadGLB(url) {
  const loader = new THREE.GLTFLoader();
  loader.load(url, (gltf) => {
    // 添加到场景
    scene.add(gltf.scene);

    // 生成树形UI
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = '';
    createTreeUI(gltf.scene, treeContainer);

    // 自动展开第一层
    const firstLevelNodes = treeContainer.querySelectorAll('.tree-node');
    firstLevelNodes.forEach(node => {
      const caret = node.querySelector('.tree-caret');
      if (caret) {
        caret.textContent = '▼';
        node.classList.add('expanded');
        node.querySelector('.tree-children').style.display = 'block';
      }
    });

    // 计算模型边界并调整相机
    const bbox = new THREE.Box3().setFromObject(gltf.scene);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x.size.y.size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2));

    controls.target.copy(center);
    camera.position.copy(center.clone().add(new THREE.Vector3(1, 0.5, 1).normalize().multiplyScalar(distance)));
    controls.update();
  });
}

// 初始化应用
initScene();

// 示例: 替换为你的GLB文件路径
loadGLB('your-model.glb');

// 或者添加文件选择器
document.body.addEventListener('dragover', (e) => e.preventDefault());
document.body.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    loadGLB(url);
  }
});
