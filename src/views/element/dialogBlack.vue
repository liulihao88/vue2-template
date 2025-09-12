<template>
  <div>
    <el-dialog :visible.sync="isShow" title="我要变黑色" append-to-body :close-on-click-modal="false" fullscreen  custom-class="dark-theme-dialog">
      我是黑色内容
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
      isShow: true
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

</style>
