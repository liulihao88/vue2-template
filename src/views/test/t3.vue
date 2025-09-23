<template>
  <div>
    奇怪啊
    <el-tooltip class="item" effect="dark" content="Top Left 提示文字" placement="top-start">
      <el-button>上左</el-button>
    </el-tooltip>
    <el-tooltip content="Top Left 提示文字"  effect="dark" placement="top-start">
      <div>
        你好
        上左
      </div>
      <!-- <el-button></el-button> -->
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'T3',
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
<style scoped lang="scss"></style>
