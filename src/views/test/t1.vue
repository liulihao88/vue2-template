<template>
  <div>
    <g-upload-file></g-upload-file>
    <g-absolute-box :customStyle="{ right: 0, top: 'calc(0% + 56px)', height: 'calc(50vh - 56px)' }" :title="'123'">
      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item label="名称" prop="name">
          <g-upload-file></g-upload-file>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" />
        </el-form-item>
      </el-form>
    </g-absolute-box>
  </div>
</template>

<script>
export default {
  name: 'T1',
  components: {},
  props: {},
  data() {
    return {
      form: {},
      rules: {},
    }
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
        // return deletePrjfilebimauditdetail(this.form.id)
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
<style scoped lang="scss"></style>
