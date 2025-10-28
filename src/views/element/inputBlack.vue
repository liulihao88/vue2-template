<template>
  <div class="box">
    <el-input
      placeholder="请输入内容"
      v-model="a"
      class="input-with-select custom-dark-input"
      size="small"
      :clearable="true"
      style="width: 180px">
      <el-button slot="append" icon="el-icon-search" size="small"></el-button>
    </el-input>
  </div>
</template>

<script>
export default {
  name: 'InputBlack',
  components: {},
  props: {},
  data() {
    return {
      a: '',
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss">
.box {
  padding: 24px;
}
::v-deep .el-input {
  .el-input__inner {
    background-color: #000;
    border-color: #000;
    color: #fff;
  }
}
::v-deep .el-input-group__append {
  background-color: #000;
  border-color: #000 #000 #000 #fff;
  border-left: 1px solid #fff;
  i {
    color: #fff;
  }
}
</style>
