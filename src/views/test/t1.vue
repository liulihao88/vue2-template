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
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss"></style>
