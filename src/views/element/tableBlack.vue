<template>
  <div class="my-table-container">
    <el-scrollbar>
      <el-table :data="list" border fit size="snall" align="center">
        <el-table-column label="标准名称" prop="standardId">
          <template slot-scope="scope">
            {{ scope.$index }}
          </template>
        </el-table-column>
        <el-table-column prop="auditContent" label="审查详情">
          <template slot-scope="scope">
            <i class="el-icon-time" />
            <span>{{ scope.row.display_time }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="created_at" label="操作" width="60">
          <template slot-scope="scope">
            <div class="dropdown-black">
              <el-dropdown trigger="click">
                <span class=""><i class="el-icon-more"></i></span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item>
                    <el-button type="text" @click="handleUpdate(scope.row)" icon="el-icon-edit">编辑</el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button type="text" @click="handleDelete(scope.row)" icon="el-icon-delete">删除</el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-scrollbar>
  </div>
</template>

<script>
import { clone } from '@/utils/gFunc'
export default {
  data() {
    return {
      list: [
        {
          id: '14000019950729782X',
          title:
            'Mwmdjbuq oefuyvbf vpzeskgyvh xlro fwdbdstwe xcgyplxe ycqtqq qzlsmbo ilma hex lhvjka lhutorbf yfewq emxbth trf ohzxmexo kkgilcofz cweelbocw vctfceary.',
          status: 'deleted',
          author: 'name',
          display_time: '2017-07-08 15:39:27',
          pageviews: 1560,
        },
        {
          id: '320000199901231013',
          title:
            'Kdos yvybx gwvemg eye oqzkkb dxiqsne eoetrh ifzcei rmtisd uokzcrb dbotjy uriucvwh vgvwt qmy msodgeoyp wkrhlsep.',
          status: 'draft',
          author: 'name',
          display_time: '2008-07-11 03:37:47',
          pageviews: 4379,
        },
      ],
    }
  },
  created() {
    this.list = clone(this.list, 10)
  },
  methods: {},
}
</script>
<style lang="scss" scoped>
.my-table-container {
  background: #000;
  height: calc(100vh - 55px);
  overflow: auto;
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
