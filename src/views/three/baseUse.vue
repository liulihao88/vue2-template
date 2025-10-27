<template>
  <div>
    <div>baseUse</div>
  </div>
</template>

<script>
import * as THREE from 'three'
export default {
  name: 'BaseUse',
  components: {},
  props: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    this.init()
  },
  methods: {
    init() {
      const width = window.innerWidth,
        height = window.innerHeight

      // init

      const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10)
      console.log(`29 camera`, camera)
      camera.position.z = 1

      const scene = new THREE.Scene()

      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
      const material = new THREE.MeshNormalMaterial()

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setAnimationLoop(animate)
      document.body.appendChild(renderer.domElement)

      // animation

      function animate(time) {
        mesh.rotation.x = time / 2000
        mesh.rotation.y = time / 1000

        renderer.render(scene, camera)
      }
    },
  },
}
</script>
<style scoped lang="scss"></style>
