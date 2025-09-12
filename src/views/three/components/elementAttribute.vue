<template>
  <absolute-box :customStyle="{ left: 0, top: '50%' }" title="元素属性">
    <template v-if="sAttribute && Object.keys(sAttribute).length > 0">
      <el-collapse :value="'base'">
        <el-collapse-item title="基础属性" name="base">
          <table class="gridtable">
            <tr>
              <td>name</td>
              <td>{{ sAttribute.name }}</td>
            </tr>
            <tr>
              <td>ElementID</td>
              <td>{{ sAttribute.ElementID }}</td>
            </tr>
          </table>
        </el-collapse-item>
      </el-collapse>

      <el-collapse v-for="(v, i) in sAttribute.Parameters" :value="v.GroupName">
        <el-collapse-item :title="v.GroupName" :name="v.GroupName">
          <table class="gridtable">
            <tr v-for="(val, idx) in v.Parameters" :key="idx">
              <td>{{ val.name }}</td>
              <td>{{ val.value }}</td>
            </tr>
          </table>
        </el-collapse-item>
      </el-collapse>
      <!-- <el-collapse :value="'yueshu'">
        <el-collapse-item title="约束" name="yueshu">
          <table class="gridtable">
            <tr>
              <td>房屋边界</td>
              <td>{{ attribute.homeBorder | formatBoolean }}</td>
            </tr>
          </table>
        </el-collapse-item>
      </el-collapse> -->
    </template>
  </absolute-box>
</template>

<script>
import absoluteBox from './absoluteBox.vue'
export default {
  name: 'T2',
  components: {
    absoluteBox,
  },
  props: {
    attribute: {
      type: Object,
      // default: () => {},
      default: () => {
        return {
          name: '20220415-天窗模型2.0.3dm',
          children: [3054],
          extras: {
            ElementID: 378975,
            UniqueId: '8ee693b8-257b-4d94-9858-30b3631eb199-0005c85f',
            Parameters: [
              {
                GroupName: '约束',
                Parameters: [
                  {
                    value: '是',
                    name: '房间边界',
                  },
                ],
              },
              {
                GroupName: '标识数据',
                Parameters: [
                  {
                    value: '<无>',
                    name: '图像',
                  },
                  {
                    name: '注释',
                  },
                  {
                    name: '标记',
                  },
                ],
              },
              {
                GroupName: '尺寸标注',
                Parameters: [
                  {
                    value: '0',
                    name: '幕墙高程',
                  },
                ],
              },
              {
                GroupName: '阶段化',
                Parameters: [
                  {
                    value: '新构造',
                    name: '创建的阶段',
                  },
                  {
                    value: '无',
                    name: '拆除的阶段',
                  },
                ],
              },
            ],
          },
        }
      },
    },
  },
  filters: {
    formatBoolean(value) {
      return value ? '是' : '否' // 可以改成任何你想要的显示方式
    },
  },
  data() {
    return {
      sAttribute: this.attribute,
    }
  },
  computed: {},
  watch: {
    attribute(newVal) {
      this.sAttribute = newVal
    },
  },
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss">
.gridtable {
  background: #3b4453;
  font-size: 12px;
  border-width: 1px;
  border-color: #fff;
  color: #fff;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  word-wrap: break-word;
  border-style: solid;
  line-height: 20px;
  & td {
    padding-left: 5px;
    border-width: 1px;
    font-size: 12px;
    border-style: solid;
    border-color: #707678;
  }
}
::v-deep .el-collapse-item__header {
  background: #3b4453;
  color: #fff;
}
::v-deep .el-collapse-item__content {
  color: #fff;
  padding-bottom: 0;
}
::v-deep .el-collapse-item__header {
  padding-bottom: 0;
  border: 0;
}
::v-deep .el-collapse {
  color: #fff;
  border: 0 !important;
}
::v-deep .el-collapse-item {
  margin-bottom: 1px !important;
}
</style>
