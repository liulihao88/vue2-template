<template>
  <div>
    <div ref="canvasContainerRef" class="canvas-container">

    </div>
    <!-- <DrawRefComp :containerRef="elementRefForChild"></DrawRefComp> -->
    <DrawRefComp :containerRef="$refs.canvasContainerRef"></DrawRefComp>
  </div>
</template>

<script>
import DrawRefComp from "./drawRefComp.vue";
export default {
  name: 'DrawRef',
  components: {
    DrawRefComp,
  },
  props: {},
  data() {
    return {
      elementRefForChild: '',
    }
  },
  mounted() {
    this.elementRefForChild = this.$refs.canvasContainerRef
  },
  methods: {},
}
</script>
<style scoped lang="scss">
.canvas-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 400px;
  height: 400px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
