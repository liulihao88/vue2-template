<template>
  <div>
    <div
      id="bimi_panel_1760519153199"
      style=" height: 200px; right: 10px; bottom: 342px; left: 808px"
      class="bim-panel">
      <div id="bimi_panel_close" class="bim-panel-close"></div>
      <div id="bimi_panel_title" class="bim-panel-title">模型信息</div>
      <!--主体-->
      <div class="bim-panel-body">
        <slot></slot>
      </div>
      <div id="bimi_panel_resize" class="bim-resize"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GCusDialog',
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
.bim-panel {
  width: 100px;
  height: 100px;
  color: #fff;
  position: absolute;
  overflow: hidden;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  background-color: rgba(17, 17, 17, 0.88);
  z-index: 9;
  border: 1px solid #333;
  box-sizing: border-box;
  padding-top: 40px;
}
.bim-panel .bim-panel-title {
  box-sizing: border-box;
  cursor: move;
  padding: 10px 30px 10px 10px;
  line-height: 20px;
  font-size: 14px;
  user-select: none;
  border-bottom: 1px solid #666;
  background-color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: -40px;
}
.bim-resize {
  height: 6px;
  width: 6px;
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 9;
}
.bim-resize::after {
  display: block;
  float: right;
  content: '';
  width: 100%;
  height: 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAABGdBTUEAALGPC/xhBQAAAF5JREFUCB1jYEADq1at4r927dpOJmRxkKC+vv5ORkbGG3BxkODNmzdPXL9+fSJWwf///zNfvnx5CTNM+79//05qaGgUAXUtBeoQYARZBDJTU1MzH6SSiYlJaMaMGYEA7E42FFiHq5AAAAAASUVORK5CYII=)
    no-repeat;
  cursor: nw-resize;
}
</style>
