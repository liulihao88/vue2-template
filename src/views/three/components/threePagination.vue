<template>
  <div class="pagination-box">
    <el-pagination
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10]"
      :page-size="10"
      layout="total, prev, pager, next"
      :total="20"></el-pagination>
  </div>
</template>

<script>
export default {
  name: 'T3',
  components: {},
  props: {},
  data() {
    return {
      currentPage: 2,
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    handleCurrentChange(val) {},
  },
}
</script>
<style scoped lang="scss">
.pagination-box {
  background-color: #000; /* 黑色背景 */
  color: #fff; /* 默认文字颜色 */
  padding: 8px;
  width: 100%;
  height: 50px;
  overflow-x: auto;
  border-radius: 4px;
  ::v-deep .el-pagination__sizes {
    pointer-events: none; /* 阻止所有鼠标事件 */
    opacity: 0.6; /* 降低不透明度，使其看起来像被禁用了 */
  }
  ::v-deep {
    /*
      1. 禁用 sizs（每页条数）选择器
     */
    .el-pagination__sizes {
      pointer-events: none; /* 阻止所有鼠标事件，使其不可点击 */
      opacity: 0.6; /* 降低不透明度，使其看起来像被禁用了 */
    }
    /*
      2. 普通按钮的样式（如 "上一页", "下一页", "跳转"）
     */
    .btn-prev,
    .btn-next,
    .el-pagination__jump .el-input__inner {
      background-color: #333; /* 按钮背景色 */
      border-color: #555; /* 按钮边框色 */
      color: #fff; /* 按钮文字颜色 */

      &:hover,
      &:focus {
        background-color: #444;
        border-color: #777;
        color: #fff;
      }
    }

    /*
      3. 页码按钮的样式（中间的 1, 2, 3...）
     */
    .el-pagination .el-pager li {
      background-color: #333;
      border-color: #555;
      color: #ccc; /* 默认页码颜色 */
      &:hover {
        background-color: #444;
        color: #fff;
      }

      &.active {
        background-color: #409eff; /* Element UI 的主色调 */
        border-color: #409eff;
        color: #fff;
      }
    }
    /*
      4. 输入框（跳转页码）和其内部 span 标签的样式
     */
    .el-pagination__jump {
      color: #ccc; /* "跳至" 文字的颜色 */

      .el-input__inner {
        width: 40px;
        background-color: #333;
        border-color: #555;
        color: #fff;

        &:hover,
        &:focus {
          background-color: #444;
          border-color: #777;
          color: #fff;
        }
      }
    }
    /*
      5. 统计信息文字（如 "共 400 条"）的颜色
     */
    .el-pagination__total {
      color: #ccc;
    }
  }
}
</style>
