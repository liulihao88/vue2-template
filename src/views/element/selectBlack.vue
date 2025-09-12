<template>
  <div class="">
    <el-select v-model="value" placeholder="请选择" popper-class="dark-select-dropdown" class="dark-select-wrapper">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: 'T3',
  components: {},
  props: {},
  data() {
    return {
      options: [
        {
          value: '选项1',
          label: '黄金糕',
        },
        {
          value: '选项2',
          label: '双皮奶',
        },
        {
          value: '选项3',
          label: '蚵仔煎',
        },
        {
          value: '选项4',
          label: '龙须面',
        },
        {
          value: '选项5',
          label: '北京烤鸭',
        },
      ],
      value: '',
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss" scoped>
.dark-select-wrapper ::v-deep .el-input--suffix .el-input__inner {
  padding-right: 30px;
  background: #000;
  color: #fff;
}
</style>
