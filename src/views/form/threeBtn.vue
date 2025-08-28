<template>
  <div class="box">
    <div class="bottom">
      <clipboardPhoto></clipboardPhoto>
      <el-button type="primary" @click="preview" size="small">审查</el-button>
    </div>

   

    <div class="right">
      <div class="table-box">
        <avue-crud :data="tableData" :option="tableOption" ref="crud" class="menu-top0" @row-save="handleSave" @row-update="handleUpdate" @row-del="handleDelete"> </avue-crud>
      </div>

      <!-- <div class="form-box">我是form</div> -->
    </div>
  </div>
</template>

<script>
import { tableOption } from "./crud";
import clipboardPhoto from "./clipboardPhoto.vue";
export default {
  name: "ThreeBtn",
  components: {
    clipboardPhoto
  },
  props: {},
  data() {
    return {
      page: [],
      tableData: [],
      tableOption: tableOption
    };
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    handleSave(row, done) {
      console.log(`74 row`, row);
      this.tableData.push(row);
      done();
    },
    handleUpdate(row, index, done) {
      console.log(`23 row`, row);
      this.tableData.splice(index, 1, row);
      done();
    },
    handleDelete(row, index, done) {
      console.log(`46 row`, row);
      this.tableData.splice(index, 1);
      done();
    }
  }
};
</script>
<style scoped lang="scss">
.box {
  width: 100%;
  height: 100%;
  position: absolute;
  .bottom {
    position: absolute;
    left: 30%;
    bottom: 30px;
    transform: translateX(-50%);
    background: #aaa;
    padding: 8px 16px;
  }
  .right {
    position: absolute;
    left: 70%;
    height: 100%;
    background: #aaa;
    height: 100%;
    .table-box {
      height: 100%;
      overflow: auto;
      .menu-top0 {
        height: 100%;
        ::v-deep .el-card {
          height: 100%;
        }
      }
    }
    .form-box {
      height: 0%;
    }
  }
}
</style>
