<template>
  <div>
    <g-absolute-box :customStyle="{ left: 0, top: '0%' }" title="部位属性"></g-absolute-box>
    <g-check-photo ref="checkPhotoRef"></g-check-photo>
    <g-absolute-box :customStyle="{ left: 0, top: '50%' }" title="元素属性"></g-absolute-box>

    <g-absolute-box :customStyle="{ right: 0, top: '0%' }" title="检查">
      <TableBlack></TableBlack>
      <template #right>
        <el-button type="text" icon="el-icon-plus">新增</el-button>
        <el-button type="text" icon="el-icon-close">关闭</el-button>
      </template>
    </g-absolute-box>
    <g-absolute-box :customStyle="{ right: 0, top: '50%' }" title="检查表单"></g-absolute-box>
  </div>
</template>

<script>
import TableBlack from '@/views/element/tableBlack.vue'
export default {
  name: 'T1',
  components: {
    TableBlack,
  },
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
