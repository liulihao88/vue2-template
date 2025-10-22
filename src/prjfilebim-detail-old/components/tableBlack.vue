<template>
  <div>
    <absolute-box :customStyle="{ right: '0', top: '55px' }" title="审查">
      <template #right>
        <el-button type="text" icon="el-icon-plus" @click="newAdd()"
          >新增</el-button
        >
        <el-button type="text" icon="el-icon-close" @click="handleClose()"
          >关闭</el-button
        >
      </template>
      <div class="my-table-container">
        <el-table :data="tableData" border fit size="snall" align="center">
          <el-table-column
            label="标准名称"
            prop="standardName"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              {{ scope.row.standardName }}
            </template>
          </el-table-column>
          <el-table-column
            prop="auditContent"
            label="审查详情"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <span>{{ scope.row.auditContent }}</span>
            </template>
          </el-table-column>
          <el-table-column
            align="center"
            prop="created_at"
            label="操作"
            width="60">
            <template slot-scope="scope">
              <div class="dropdown-black">
                <el-dropdown trigger="click">
                  <span class=""><i class="el-icon-more"></i></span>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item>
                      <el-button
                        type="text"
                        @click="handleUpdate(scope.row)"
                        icon="el-icon-edit"
                        >编辑</el-button
                      >
                    </el-dropdown-item>
                    <el-dropdown-item>
                      <el-button
                        type="text"
                        @click="handleDelete(scope.row)"
                        icon="el-icon-delete"
                        >删除</el-button
                      >
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </absolute-box>
    <PrjUploadFile
      ref="prjUploadFileRef"
      @success="init"
      :baseInfo="baseInfo"></PrjUploadFile>
  </div>
</template>

<script>
import {
  getPrjfilebimauditdetail,
  postPrjfilebimauditdetail,
  putPrjfilebimauditdetail,
  deletePrjfilebimauditdetail
} from '../api.js'
import AbsoluteBox from './absoluteBox.vue'
import PrjUploadFile from './prjUploadFile.vue'
export default {
  components: {
    AbsoluteBox,
    PrjUploadFile
  },
  props: {
    baseInfo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      tableData: []
    }
  },
  created() {},
  methods: {},
  methods: {
    async init() {
      let params = {
        current: 1,
        size: 100,
        bimId: this.baseInfo.id
      }
      let res = await getPrjfilebimauditdetail(params)
      console.log(`08 res`, res)
      console.log(`75 res.data`, res.data)
      if (res.data.code === 0) {
        this.tableData = res.data.data.records
        this.newAdd()
      }
    },
    newAdd() {
      this.$refs.prjUploadFileRef.open()
    },

    handleClose() {
      this.$emit('handleTableClose')
    },
    async handleUpdate(row) {
      this.$refs.prjUploadFileRef.open(row)
    },
    async handleDelete(row) {
      this.$confirm('是否确认删除？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(function () {
          return deletePrjfilebimauditdetail(row.id)
        })
        .then(data => {
          this.$message.success('删除成功')
          this.init()
        })
    }
  }
}
</script>
<style lang="scss" scoped>
.my-table-container {
  background: #000;
  /* 针对 el-table 内部的 el-dropdown 菜单项悬停 */
  .el-table .el-dropdown-menu__item:hover {
    background-color: black !important;
    color: white !important; /* 可选：提高可读性 */
  }
  /* 表格整体样式 */
  ::v-deep .el-table {
    background-color: #000;
    color: #fff;
    border: 1px solid #333;

    th {
      background-color: #1a1a1a;
      color: #fff;
      border-bottom: 1px solid #333;
    }

    tr {
      background-color: #000;
      color: #fff;

      &:hover > td {
        background-color: #333 !important;
      }
    }

    td {
      border-bottom: 1px solid #333;
    }

    /* 选中行样式 - 禁用选中颜色或设置为黑色 */
    .el-table__row.selected {
      background-color: #000 !important;
    }

    /* 复选框样式 */
    .el-checkbox__inner {
      background-color: #000;
      border-color: #666;
    }
  }

  /* 下拉菜单样式 */
  ::v-deep .el-dropdown-menu {
    background-color: #1a1a1a;
    border: 1px solid #333;

    .el-dropdown-menu__item {
      color: #fff;

      &:hover {
        background-color: #333 !important;
        color: #fff !important;
      }
    }
  }
  ::v-deep .el-dropdown-menu {
    background-color: #1a1a1a;
    border: 1px solid #333;
  }
  .el-dropdown-menu__item:hover {
    background-color: black !important;
    color: white !important; /* 可选：文字颜色改为白色提高对比度 */
  }
  .el-table__row.selected {
    background-color: #000 !important;
  }
  .el-popper[x-placement^='bottom'] .popper__arrow::after {
    border-bottom-color: black !important;
  }
  .el-popper[x-placement^='top'] .popper__arrow::after {
    border-top-color: black !important;
  }

  /* 下拉按钮样式 */
  .el-dropdown-link {
    color: #fff;
    cursor: pointer;
  }
}
.el-dropdown-menu {
  background-color: #1a1a1a;
  border: 1px solid #333;
  &:hover {
    background-color: #1a1a1a;
  }
}

.el-dropdown-menu__item:hover {
  background-color: black !important;
  color: white !important; /* 可选：提高可读性 */
}
.el-popper__arrow:before {
  background-color: black !important;
  right: 0;
}
.popper_arrow::after {
  border-bottom-color: #333 !important;
}
.el-popper ::v-deep .popper__arrow::after {
  border-bottom-color: #333 !important;
}
</style>
