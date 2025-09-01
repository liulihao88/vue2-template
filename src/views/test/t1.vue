<template>
  <div>
    <g-absolute-box
      :customStyle="{
        left: 0,
        top: '0%',
      }"
      title="部位属性"></g-absolute-box>
    <g-check-photo
      ref="checkPhotoRef"></g-check-photo>
    <g-absolute-box
      :customStyle="{
        left: 0,
        top: '50%',
      }"
      title="元素属性">
      <!-- <el-descriptions title="用户信息">
        <el-descriptions-item label="用户名">kooriookami</el-descriptions-item>
        <el-descriptions-item label="手机号">18100000000</el-descriptions-item>
        <el-descriptions-item label="居住地">苏州市</el-descriptions-item>
        <el-descriptions-item label="备注">
          <el-tag size="small">学校</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系地址"
          >江苏省苏州市吴中区吴中大道 1188 号</el-descriptions-item
        >
      </el-descriptions> -->
      <el-descriptions
        title="基础数据"
        :column="1">
        <el-descriptions-item
          label="name">
          aa石膏板aa石膏板aa石膏板aa石膏板aa石膏板aa石膏板aa石膏板aa石膏板aa石膏板
        </el-descriptions-item>
        <el-descriptions-item
          label="elementId">
          432
        </el-descriptions-item>
      </el-descriptions>
    </g-absolute-box>

    <g-absolute-box
      :customStyle="{
        right: 0,
        top: '0%',
      }"
      title="检查">
      <TableBlack></TableBlack>
      <template
        #right>
        <el-button
          type="text"
          icon="el-icon-plus">
          新增
        </el-button>
        <el-button
          type="text"
          icon="el-icon-close">
          关闭
        </el-button>
      </template>
    </g-absolute-box>
    <g-absolute-box
      :customStyle="{
        right: 0,
        top: '50%',
      }"
      title="检查表单"></g-absolute-box>
  </div>
</template>

<script>
import TableBlack from '@/views/element/tableBlack.vue'
export default {
  name: 'T1',
  components: {
    TableBlack,
  },
  props: {},
  data() {
    return {
      name: 123,
      obj: {
        name: 'A_A石膏板',
        id: '42',
      },
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style
  scoped
  lang="scss"></style>
