<template>
  <g-absolute-box :customStyle="{ left: 0, top: '50%' }" title="元素属性">
    <template v-if="attribute && Object.keys(attribute).length > 0">
      <el-collapse :value="'base'">
        <el-collapse-item title="基础属性" name="base">
          <table class="gridtable">
            <tr>
              <td>name</td>
              <td>{{ attribute.name }}</td>
            </tr>
            <tr>
              <td>ElementID</td>
              <td>{{ attribute.id }}</td>
            </tr>
          </table>
        </el-collapse-item>
      </el-collapse>
      <el-collapse :value="'yueshu'">
        <el-collapse-item title="约束" name="yueshu">
          <table class="gridtable">
            <tr>
              <td>房屋边界</td>
              <td>{{ attribute.homeBorder | formatBoolean }}</td>
            </tr>
          </table>
        </el-collapse-item>
      </el-collapse>
    </template>
  </g-absolute-box>
</template>

<script>
export default {
  name: 'T2',
  components: {},
  props: {
    attribute: {
      type: Object,
      default: () => {},
    },
  },
  filters: {
    formatBoolean(value) {
      return value ? '是' : '否' // 可以改成任何你想要的显示方式
    },
  },
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
.gridtable {
  background: #3b4453;
  font-size: 12px;
  border-width: 1px;
  border-color: #fff;
  color: #fff;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  word-wrap: break-word;
  border-style: solid;
  line-height: 20px;
  & td {
    padding-left: 5px;
    border-width: 1px;
    font-size: 12px;
    border-style: solid;
    border-color: #707678;
  }
}
::v-deep .el-collapse-item__header {
  background: #3b4453;
  color: #fff;
}
::v-deep .el-collapse-item__content {
  color: #fff;
  padding-bottom: 0;
}
::v-deep .el-collapse-item__header {
  padding-bottom: 0;
  border: 0;
}
::v-deep .el-collapse {
  color: #fff;
  border: 0 !important;
}
::v-deep .el-collapse-item {
  margin-bottom: 1px !important;
}
</style>
