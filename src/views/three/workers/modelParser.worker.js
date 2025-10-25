import * as THREE from 'three'
// self 指向 Worker 的全局作用域
self.onmessage = function (e) {
  // Worker 接收到的是模型对象的 JSON 表示
  console.log(`07 e`, e)
  console.log(`%c45 6行 three/workers/modelParser.worker.js e`, 'background:#fff;color:blue', e)

  const model = e.data.model
  console.log(`78 model`, model)

  // 我们需要在 Worker 内部使用 THREE，所以必须有它的运行环境
  if (typeof THREE === 'undefined') {
    // 为了安全起见，做一次检查
    self.postMessage({ error: 'THREE.js is not available in the Worker context.' })
    return
  }

  // 使用 THREE.Object3D 的 parseJSON 方法来重建一个基础的 THREE 对象树
  // 注意：这个解析可能无法 100% 还原所有类型（如 BufferGeometry），但对于遍历结构、UUID、用户数据等是足够的。
  // console.log(`61 modelJson`, modelJson)
  // console.log(`63 model`, model);

  const sceneNodes = [] // 存储我们自定义的树节点
  const nodeMap = new Map() // THREE.Object3D's uuid -> our custom node object
  const meshNodeMap = new Map() // THREE.Mesh -> our custom node object
  const materialMeshMap = new Map() // material.id -> [THREE.Mesh1, THREE.Mesh2, ...]
  const allInteractiveMeshes = [] // 一个存放所有 THREE.Mesh 对象的数组，用于 raycaster

  // 核心递归处理函数
  function processObject(object, parentNode = null) {
    if (!object) return
    // 跳过相机和灯光，它们通常不需要作为交互节点
    if (object.type === 'Camera' || object.type === 'Light') {
      return
    }

    const node = {
      uuid: object.uuid,
      name: object.name || `Node_${object.type}`,
      type: object.type,
      visible: object.visible,
      isMesh: object.isMesh,
      userData: object.userData,
      children: [],
    }

    // 2. 节点关系维护
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      sceneNodes.push(node) // 顶层节点
    }
    nodeMap.set(object.uuid, node)

    // 3. 为 Mesh 做特殊处理
    if (object.isMesh) {
      allInteractiveMeshes.push(object)
      object.userData.selectable = true
      meshNodeMap.set(object, node)

      // 4. 建立材质映射 (用于批量高亮/取消高亮)
      const matId = object.material.id
      if (!materialMeshMap.has(matId)) {
        materialMeshMap.set(matId, [])
        // 你可以在这里收集材质信息，比如名称
        // console.log(`New material found: ${object.material.name}`);
      }
      materialMeshMap.get(matId).push(object)
    }

    // 4. 递归处理子对象
    if (object.children && object.children.length > 0) {
      object.children.forEach((child) => {
        processObject(child, node)
      })
    }
  }

  // 开始处理
  console.log(`24 model.object.children[0]`, model.object.children[0])
  // processObject(model.object.children[0])
  processObject(model.object.children[0])

  // 将所有处理好的数据打包返回给主线程
  self.postMessage({
    custom: '你愁啥',
    sceneNodes,
    nodeMap: Array.from(nodeMap.entries()),
    meshNodeMap: Array.from(meshNodeMap.entries()),
    materialMeshMap: Array.from(materialMeshMap.entries()),
    allInteractiveMeshes, // 这个数组是 raycaster 的性能关键
  })

  console.log('Worker: Data processing complete. Sending back to main thread.')
}

self.onerror = function (error) {
  console.error('Worker error:', error)
}
