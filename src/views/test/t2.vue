<template>
  <div class="box">
    <avue-crud
      :data="tableData"
      :option="tableOption"
      ref="crud"
      class="custom-dark-crud"
      :highlight-current-row="false"
    >
      <template #operation="{ row }">
        <div class="custom-operation-column">
          <el-dropdown>
            <span class=""><i class="el-icon-more"></i></span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <el-button type="text" @click="handleUpdate(row)" icon="el-icon-edit">编辑</el-button>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-button type="text" @click="handleDelete(row)" icon="el-icon-delete">删除</el-button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </template>
    </avue-crud>
  </div>
</template>

<script>
import { tableOption } from './crud.js'
export default {
  name: 'T2',
  components: {},
  props: {},
  data() {
    return {
      tableOption: tableOption,
      tableData: [],
    }
  },
  computed: {},
  watch: {},
  created() {
    this.init()
  },
  methods: {
    init() {
      this.tableData = [
        {
          creator: '4',
          fileName: 'BTDS_F4-F10_CD_A-20220505.rvt',
          standardName: '检查模型几何尺寸准确性',
          standardId: 'fbad4c6fd21540de8b3833477eb8db1d',
          updateTime: '2025-08-27 11:38:14',
          prjName: '北京城市副中心行政办公区道路网2017配套道路',
          updater: '4',
          auditContent: 'fff1111321321',
          createTime: '2025-08-26 17:49:46',
          bimId: 'abe9f8ad366c11edbd96f46b8c5c9508',
          auditPics: '/admin/sys-file/prjfilebimauditdetail/aab35ae6ba034d62b950fe68868ac528.png',
          tenantId: 5,
          auditStatus: '1',
          id: '51f08d88c28f4315b70b43f041f6823c',
          status: '0',
        },
        {
          creator: '4',
          fileName: 'BTDS_F4-F10_CD_A-20220505.rvt',
          standardName: '检查模型几何尺寸准确性',
          standardId: 'fbad4c6fd21540de8b3833477eb8db1d',
          updateTime: '2025-08-27 14:26:31',
          prjName: '北京城市副中心行政办公区道路网2017配套道路',
          updater: '4',
          auditContent: '2',
          createTime: '2025-08-26 17:49:38',
          bimId: 'abe9f8ad366c11edbd96f46b8c5c9508',
          auditPics: '/admin/sys-file/prjfilebimauditdetail/aab35ae6ba034d62b950fe68868ac528.png',
          tenantId: 5,
          auditStatus: '1',
          id: '5297e2f58e1142a399495ac7f53394a3',
          status: '0',
        },
        {
          creator: '4',
          fileName: 'BTDS_F4-F10_CD_A-20220505.rvt',
          standardName: '检查模型几何尺寸准确性',
          standardId: 'fbad4c6fd21540de8b3833477eb8db1d',
          updateTime: '2025-08-14 16:48:16',
          prjName: '北京城市副中心行政办公区道路网2017配套道路',
          updater: '4',
          auditContent: 'fff',
          createTime: '2025-08-12 14:56:21',
          bimId: 'abe9f8ad366c11edbd96f46b8c5c9508',
          auditPics: '/admin/sys-file/prjfilebimauditdetail/aab35ae6ba034d62b950fe68868ac528.png',
          tenantId: 5,
          auditStatus: '1',
          id: 'a27ef1cde2a240f9b971bdf997ed8676',
          status: '0',
        },
      ]
    },
    handleSave(row) {
      console.log(`07 row`, row)
    },
    handleUpdate(row) {
      console.log(`07 row`, row)
    },
    handleDelete(row) {
      console.log(`07 row`, row)
    },
  },
}
</script>
<style scoped lang="scss">
.box {
  width: 500px;
}
.custom-dark-crud {
  background: #000 !important; /* CRUD 外围背景 */
}
::v-deep .el-table {
  --el-table-bg-color: #111 !important; /* 表格主体背景 */
  --el-table-header-bg-color: #222 !important; /* 表头背景 */
  --el-table-text-color: #fff !important; /* 文字颜色 */
  --el-table-border-color: #333 !important; /* 边框颜色 */
  --el-table-row-hover-bg: #333 !important; /* 行悬停背景 */
  /* 强制覆盖默认样式 */
  background-color: var(--el-table-bg-color) !important;
  color: var(--el-table-text-color) !important;
  /* 表头单元格 */
  th.el-table__cell {
    background-color: var(--el-table-header-bg-color) !important;
    color: #ddd !important;
  }
  /* 数据单元格 */
  td.el-table__cell {
    background-color: var(--el-table-bg-color) !important;
    border-bottom: 1px solid var(--el-table-border-color) !important;
  }
  /* 分页组件 */
  .avue-crud__pagination {
    background: #000 !important;
    border-top: 1px solid var(--el-table-border-color) !important;
  }
}
/* 斑马纹表格适配 */
.custom-dark-crud ::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #0a0a0a !important;
}
::v-deep tr,
::v-deep th,
::v-deep {
  background: #222 !important;
  color: #fff;
}
.more-icon {
  display: flex;
  align-items: center;
}
.custom-dark-crud ::v-deep .el-dropdown {
  color: #fff !important; /* 三点菜单图标颜色 */
}
/* 三点更多图标悬停 */
.custom-dark-crud ::v-deep .el-icon-more:hover {
  color: #409eff !important;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 2px;
}
/* 深度穿透仅针对当前组件的 avue-crud */
.custom-dark-crud ::v-deep .el-table {
  /* 强制重置所有单元格底色 */
  --el-table-tr-bg-color: #111 !important; /* 普通行 */
  --el-table-row-hover-bg-color: #333 !important; /* 悬停行 */
  /* 核心样式覆盖 */
  background-color: #000 !important; /* 表格外围背景 */
  tr:hover {
    > td,
      > td.is-center,
      .el-table__expand-icon,      /* 展开按钮 */
      .el-dropdown,                /* 下拉菜单容器 */
      .custom-operation-column {
      /* 你的操作栏自定义class */
      background-color: var(--el-table-row-hover-bg-color) !important;
      border-bottom-color: #444 !important;
    }
    ::v-deep .custom-operation-column {
      /* 你的操作栏自定义class */
      background-color: var(--el-table-row-hover-bg-color) !important;
      border-bottom-color: #444 !important;
    }
  }
  .el-table__body,
  .el-table-row {
    tr:hover {
      > td,
      > td.is-center,
      .el-table__expand-icon,      /* 展开按钮 */
      .el-dropdown,                /* 下拉菜单容器 */
      .custom-operation-column {
        /* 你的操作栏自定义class */
        background-color: var(--el-table-row-hover-bg-color) !important;
        border-bottom-color: #444 !important;
      }
      ::v-deep .custom-operation-column {
        /* 你的操作栏自定义class */
        background-color: var(--el-table-row-hover-bg-color) !important;
        border-bottom-color: #444 !important;
      }
    }
  }
  /* 表头固定颜色 */
  th.el-table__cell {
    background-color: #222 !important;
    color: #ddd !important;
  }
}
</style>
