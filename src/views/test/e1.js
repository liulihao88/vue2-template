<template>
  <div>
    <absolute-box :customStyle="{ right: 0, top: '50%' }" :title="title">
      <template #right>
        <el-button type="text" icon="el-icon-plus" @click="handleSave"
          >保存
        </el-button>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
        :rules="rules"
        class="dark-form">
        <el-form-item label="标准名称" prop="standardId">
          <el-select
            v-model="form.standardId"
            placeholder="请选择标准名称"
            popper-class="dark-select-dropdown"
            class="custom-dark-select">
            <el-option
              v-for="item in standardOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审查截图" prop="auditPics">
          <el-upload
            class="upload-demo"
            style="width: 100%; height: 100%"
            action="#"
            :http-request="customUpload"
            list-type="picture-card"
            :limit="1"
            :headers="uploadHeaders"
            :before-upload="handleBeforeUploadImage"
            :on-error="handleError"
            :on-success="handleSuccess"
            :show-file-list="false"
            :file-list="fileList">
            <!-- 动态显示上传按钮或图片 -->
            <template v-if="!form.auditPics">
              <!-- 没有图片时显示上传按钮 -->
              <el-button size="small" type="primary">点击上传</el-button>
              <div slot="tip" class="el-upload__tip cl-white">
                只能上传jpg/png文件
              </div>
            </template>
            <template v-else>
              <div class="preview-wrapper">
                <el-image
                  :src="form.auditPics"
                  @click.stop="() => {}"
                  fit="cover"
                  class="custom-card-style" />
                <span
                  class="el-upload-list__item-preview"
                  @click.stop="handlePictureCardPreview()">
                  <i class="el-icon-zoom-in"></i>
                </span>
                <span
                  class="el-upload-list__item-delete"
                  @click.stop="handleRemoveImage()">
                  <i class="el-icon-delete"></i>
                </span>
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="审查详情" prop="auditContent">
          <el-input
            v-model="form.auditContent"
            type="textarea"
            placeholder="请输入" />
        </el-form-item>
      </el-form>
    </absolute-box>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="" />
    </el-dialog>
  </div>
</template>

<script>
import request from '@/router/axios'
import AbsoluteBox from './absoluteBox.vue'
import {
  getStandardOptions,
  postPrjfilebimauditdetail,
  putPrjfilebimauditdetail
} from '../api.js'
export default {
  name: 'T4',
  components: {
    AbsoluteBox
  },
  props: {
    baseInfo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rules: {
        standardId: [
          { required: true, message: '标准名称必须填选', trigger: 'blur' }
        ],
        auditPics: [
          { required: true, message: '审查截图必须填选', trigger: 'blur' }
        ],
        auditContent: [
          { required: true, message: '审查详情必须填写', trigger: 'blur' }
        ]
      },
      editRow: {},
      dialogVisible: false,
      dialogImageUrl: '',
      form: {
        standardId: '',
        auditContent: '',
        auditPics: ''
      },
      standardOptions: [],
      title: '新增审查',
      fileList: [] // 已上传文件列表
    }
  },
  computed: {
    uploadHeaders() {
      return {
        Authorization: `Bearer ${this.$store.getters.access_token}`
      }
    },
    iamgeUrl() {
      return ''
    }
  },
  watch: {},
  created() {
    this.initOptions()
  },
  mounted() {},
  methods: {
    // ✅ 取消选择时清空 fileList，确保下次更换图片时仍走 customUpload
    handleRemoveImage() {
      this.fileList = []
      this.form.auditPics = ''
    },
    async customUpload(options) {
      console.log(`18 options`, options)
      const formData = new FormData()
      formData.append('file', options.file)
      let res = await request({
        url: '/admin/sys-file/upload?bucketName=prjfilebimauditdetail',
        method: 'post',
        data: formData,
        headers: {
          Authorization: `Bearer ${this.$store.getters.access_token}`
        }
      })
      console.log(`res11`, res)
      if (res.data.code === 0) {
        this.form.auditPics = res.data.data.url
      }
    },
    async initOptions() {
      let res = await getStandardOptions()
      if (res.data.code === 0) {
        this.standardOptions = res.data.data
      }
    },
    async handleSave() {
      this.$refs.formRef.validate(async valid => {
        if (valid) {
          let params = {
            bimId: this.baseInfo.id,
            standardId: this.form.standardId,
            auditContent: this.form.auditContent,
            auditPics: this.form.auditPics
          }
          let res = {}
          if (Object.keys(this.editRow).length > 0) {
            params.id = this.editRow.id
            res = await putPrjfilebimauditdetail(params)
          } else {
            res = await postPrjfilebimauditdetail(params)
          }
          if (res?.data?.code === 0) {
            this.$message.success('保存成功')
            this.$emit('success')
          }
        }
      })
    },
    open(row = '') {
      console.log(`17 row`, row)
      if (!row) {
        this.form = {}
        this.editRow = {}
        this.title = '新增审查'
      } else {
        this.form = Object.assign({}, row)
        this.editRow = Object.assign({}, row)
        this.title = row.standardName
      }
    },
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
      this.$message.error('上传失败: ' + err.message)
    },
    // 上传成功回调
    handleSuccess(response, file, fileList) {
      this.fileList = fileList
    },
    handlePictureCardPreview() {
      this.dialogImageUrl = this.form.auditPics
      this.dialogVisible = true
    }
  }
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
el-upload--picture-card {
  position: relative;
  overflow: hidden;
}
/* 模拟 "+" 号（无图片时） */
.el-upload--picture-card .el-icon-plus {
  font-size: 28px;
  color: #8c939d;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
/* 隐藏 "+"（有图片时） */
.el-upload-list__item-thumbnail ~ .el-icon-plus {
  display: none;
}

/* ✅ 1. 让 preview-wrapper 控制绝对定位 */
.preview-wrapper {
  position: relative; /* 让内部元素绝对定位相对于它 */
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    .el-upload-list__item-preview,
    .el-upload-list__item-delete {
      display: flex;
    }
  }
}
/* ✅ 2. el-image 样式（确保占满父容器） */
.custom-card-style {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 确保图片按比例填充 */
}
/* ✅ 3. 放大和删除按钮样式（居中显示） */
.el-upload-list__item-preview,
.el-upload-list__item-delete {
  /* 基础样式 */
  position: absolute;
  color: white;
  // background: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: none;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10; /* 确保按钮在图片上方 */
  /* 悬停效果 */
  transition: all 0.3s;
}
.el-upload-list__item-delete {
  border-radius: 0;
}
.el-upload-list__item-preview:hover,
.el-upload-list__item-delete:hover {
  background: rgba(0, 0, 0, 0.8);
}
/* 放大按钮的位置（靠左居中） */
.el-upload-list__item-preview {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateX(-20px); /* 向左偏移一点 */
}
/* 删除按钮的位置（靠右居中） */
.el-upload-list__item-delete {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateX(20px); /* 向右偏移一点 */
}
/* 上传状态提示（可选样式） */
.uploading-text {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
</style>
