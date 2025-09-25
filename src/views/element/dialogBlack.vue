<template>
  <div>
    <el-dialog
      :visible.sync="isShow"
      title="我要变黑色"
      append-to-body
      :close-on-click-modal="false"
      fullscreen
      custom-class="dark-theme-dialog">
      我是黑色内容
      <el-button type="primary" @click="openDialog">$dialog的黑色主题</el-button>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DialogBlack',
  components: {},
  props: {},
  data() {
    return {
      isShow: true,
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    openDialog() {
      this.$confirm('是否确认删除？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'dark-theme-dialog',
      })
        .then(function () {
          // return deletePrjfilebimauditdetail(this.editRow.id)
        })
        .then((data) => {
          this.$message.success('删除成功')
          // this.init()
        })
    },
  },
}
</script>
<style scoped lang="scss"></style>
