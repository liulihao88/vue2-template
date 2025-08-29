<template>
  <div>
    <avue-crud :data="tableData" :option="tableOption" ref="crud" class="custom-dark-crud" :highlight-current-row="false"></avue-crud>
  </div>
</template>

<script>
export default {
  name: "Base",
  components: {},
  props: {},
  data() {
    return {
      tableData: [],
      tableOption: {
        column: [
          {
            type: "select",
            label: "标准名称",
            prop: "standardId"
          },

          {
            label: "操作",
            width: 60,
            prop: "operation",
            align: "center"
          }
        ]
      }
    };
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {}
};
</script>
<style scoped lang="scss"></style>
