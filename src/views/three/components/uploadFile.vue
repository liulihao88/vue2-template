<template>
  <div>
    <absolute-box :customStyle="{ right: 0, top: '50%' }" title="新增表单">
      <el-form ref="form" :model="form" label-width="80px" class="dark-form">
        <el-form-item label="标准名称">
          <el-input v-model="form.standardId" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="审查截图">
          <el-upload
            class="upload-demo"
            action="/admin/sys-file-up;pad?bucketName=prjfilebimauditdetail"
            :on-preview="handlePictureCardPreview"
            list-type="picture-card"
            :limit="1"
            v-model="form.auditPics"
            :before-upload="handleBeforeUploadImage"
            :on-error="handleError"
            :on-success="handleSuccess"
            :file-list="fileList"
          >
            <template v-if="fileList.length === 0">
              <!-- 没有文件时显示上传按钮 -->
              <el-button size="small" type="primary">点击上传</el-button>
              <div slot="tip" class="el-upload__tip cl-white">只能上传jpg/png文件</div>
            </template>

            <!-- 上传中的提示 -->
            <div v-if="uploading" slot="tip" class="uploading-text">上传中...请稍候</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="审查详情">
          <el-input v-model="form.auditContent" type="textarea" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </absolute-box>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="" />
    </el-dialog>
  </div>
</template>

<script>
import AbsoluteBox from './absoluteBox.vue'
export default {
  name: 'T4',
  components: {
    AbsoluteBox
  },
  props: {},
  data() {
    return {
      dialogVisible: false,
      dialogImageUrl: '',
      form: {
        standardId: '',
        auditContent: '',
        auditPics: '',
      },
      fileList: [], // 已上传文件列表
      uploading: false, // 上传状态
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {
    handleBeforeUploadImage(file) {
      console.log('file', file)
      const imageSuffix = ['jpg', 'jpeg', 'png', 'svg']
      const temparr = file.name.split('.')
      const fileSuffix = temparr[temparr.length - 1]
      const flag = imageSuffix.includes(fileSuffix)
      // const { sizeLimit = 2 } = options
      const sizeLimit = 2
      // 图片大小限制为2M
      const sizeFlag = file.size <= 1024 * 1024 * sizeLimit
      if (flag && sizeFlag) {
        return true
      } else {
        Message.warning(`请上传jpg/png格式图片文件,且小于${sizeLimit}M`)
        return false
      }
    },
    // 上传失败回调
    handleError(err, file, fileList) {
      this.uploading = false
      this.$message.error('上传失败: ' + err.message)
    },
    // 上传成功回调
    handleSuccess(response, file, fileList) {
      this.uploading = false
      this.fileList = fileList
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
  },
}
</script>
<style scoped lang="scss">
.dark-form {
  ::v-deep .el-form-item__label {
    color: #fff;
  }
  ::v-deep .el-input__inner,
  ::v-deep .el-textarea__inner {
    background-color: #000 !important;
    color: #fff !important;
    border: 1px solid #333 !important;
  }
  ::v-deep .el-input__inner::placeholder,
  ::v-deep .el-textarea__inner::placeholder {
    color: #999 !important;
  }
  ::v-deep .el-upload--picture-card {
    background: #000;
  }
}
</style>
