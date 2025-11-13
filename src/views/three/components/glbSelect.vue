<template>
  <el-select
    :value="value"
    @change="handleChange"
    placeholder="请选择"
    popper-class="dark-select-dropdown"
    class="dark-select-wrapper top-select">
    <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
  </el-select>
</template>

<script>
export default {
  name: 'GlbSelect',
  components: {},
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      selectOptions: [
        {
          value: '2.glb',
          label: '2.glb',
        },
        {
          value: '3.glb',
          label: '3.glb',
        },
        {
          value: '4.glb',
          label: '4.glb',
        },
        {
          value: '6.glb',
          label: '6.glb',
        },
        {
          value: '11.glb',
          label: '11.glb',
        },
      ],
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    handleChange(val) {
      this.$emit('input', val)
      this.$emit('change', val)
    },
  },
}
</script>

<style scoped lang="scss">
.top-select {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000000;
}
.top-select ::v-deep .el-input--suffix .el-input__inner {
  padding-right: 30px;
  background: #000;
  color: #fff;
}
</style>
