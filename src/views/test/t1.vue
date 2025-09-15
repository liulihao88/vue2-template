<template>
  <div>
    <g-absolute-box title="我想测试全屏">
      你好啊

      <div class="full-screen-overlay">我是全屏</div>
    </g-absolute-box>
  </div>
</template>

<script>
export default {
  name: 'T1',
  components: {},
  props: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss">
.full-screen-overlay {
  position: fixed; /* 关键！相对于视口定位 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 0, 0.9);
  color: #333;
  z-index: 1; /* 确保它在下面 */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
