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
  created() {
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
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss">

</style>
