<template>
  <div>
    <absolute-box :customStyle="{ right: 0, top: 'calc(50% + 10px)', height: 'calc(50vh - 10px)' }" :title="title" v-if="isShow">
      <template #right>
        <el-button
          type="text"
          :icon="isShowDraw ? 'el-icon-close' : 'el-icon-edit'"
          @click="handleCanEdit"
          v-if="isEdit && !canEdit">
          {{ '编辑' }}
        </el-button>
        <!-- <el-button
          type="text"
          :icon="isShowDraw ? 'el-icon-close' : 'el-icon-edit'"
          @click="handleDrawEdit"
          v-if="!isEdit || canEdit">
          {{ isShowDraw ? '取消批注' : '批注' }}
        </el-button> -->

        <el-button type="text" @click="handleSave" icon="el-icon-check" v-if="!isEdit || canEdit">保存</el-button>
        <el-button type="text" @click="deleteItem" icon="el-icon-delete" v-if="isEdit && canEdit">删除</el-button>
        <el-button type="text" @click="cancelEdit" icon="el-icon-close" v-if="isEdit && canEdit">取消</el-button>
      </template>
      <DrawThree ref="drawThreeRef"></DrawThree>
      <el-form
        ref="formRef"
        :model="form"
        label-width="auto"
        class="dark-form"
        :disabled="isEdit && !canEdit"
        :rules="rules">
        <el-form-item prop="auditPics">
          <template #label>
            <el-tooltip content="只能上传jpg/png文件,且大小不超过2MB" style="display: inline-block">
              <div>审查截图</div>
            </el-tooltip>
          </template>

          <!-- <el-upload
            class="upload-demo"
            action="/admin/sys-file-up;pad?bucketName=prjfilebimauditdetail"
            :on-preview="handlePictureCardPreview"
            list-type="picture-card"
            :limit="1"
            v-model="form.auditPics"
            :before-upload="handleBeforeUploadImage"
            :on-error="handleError"
            :on-success="handleSuccess"
            :file-list="fileList">
            <template v-if="fileList.length === 0">
              <el-button size="small" type="primary">点击上传</el-button>
            </template>

            <div v-if="uploading" slot="tip" class="uploading-text">上传中...请稍候</div>
          </el-upload> -->
          <UploadFileByClipboard v-model="form.auditPics"></UploadFileByClipboard>
        </el-form-item>
        <el-form-item label="审查类别" prop="standardId">
          <el-select
            v-model="form.standardId"
            placeholder="请选择标准名称"
            style="width: 100%"
            popper-class="dark-select-dropdown"
            class="custom-dark-select">
            <el-option
              v-for="item in standardOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="审查内容" prop="auditContent">
          <el-input v-model="form.auditContent" type="textarea" placeholder="请输入" :rows="7" />
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
import DrawThree from './drawThree.vue'
import { clone } from '@/utils/gFunc.js'
import UploadFileByClipboard from './uploadFileByClipboard.vue'
export default {
  name: 'T4',
  components: {
    AbsoluteBox,
    DrawThree,
    UploadFileByClipboard,
  },
  props: {},
  data() {
    return {
      rules: {
        standardId: [{ required: true, message: '审查类别必须选择', trigger: 'blur' }],
        auditPics: [{ required: true, message: '审查截图必须选择', trigger: 'blur' }],
        auditContent: [{ required: true, message: '审查内容必须填写', trigger: 'blur' }],
      },
      isShowDraw: true,
      dialogVisible: false,
      dialogImageUrl: '',
      canEdit: false,
      isEdit: false,
      form: {
        standardId: '',
        auditContent: '',
        auditPics: '',
      },
      isShow: false,
      standardOptions: [],
      fileList: [], // 已上传文件列表
      uploading: false, // 上传状态
    }
  },
  computed: {
    title() {
      if (this.isEdit) {
        return '编辑审查'
      } else {
        return '新增审查'
      }
    },
  },
  watch: {},
  created() {
    this.$mitt.on('mEditItem', this.editItem)
    this.initOptions()
  },
  beforeDestroy() {
    this.$mitt.off('mEditItem')
    this.reset()
  },
  mounted() {},
  methods: {
    cancelEdit() {
      this.canEdit = false
    },
    async initOptions() {
      // let res = await getStandardOptions()
      // if (res.data.code === 0) {
      // this.standardOptions = res.data.data
      // }
      this.standardOptions = [
        {
          label: '类别1',
          value: '1',
        },
        {
          label: '类别2',
          value: '2',
        },
      ]
    },
    handleCanEdit() {
      this.canEdit = true
    },
    editItem(row) {
      this.isShow = true
      this.$refs.formRef?.clearValidate()
      this.$refs.drawThreeRef?.clearCanvas()
      this.reset()
      if (!row) {
        this.isEdit = false
        this.form = {}
      } else {
        this.isEdit = true
        this.form = clone(row)
        this.form.standardIdCopy = this.form.standardId
      }
    },
    reset() {
      this.isShowDraw = false
      this.canEdit = false
    },
    handleDrawEdit() {
      this.isShowDraw = !this.isShowDraw
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
    handleSave() {
      this.$refs.formRef.validate(async (valid) => {
        if (valid) {
          this.$message('chengg')
          // let params = {
          //   bimId: this.baseInfo.id,
          //   standardId: this.form.standardId,
          //   auditContent: this.form.auditContent,
          //   auditPics: this.form.auditPics
          // }
          // let res = {}
          // if (Object.keys(this.editRow).length > 0) {
          //   params.id = this.editRow.id
          //   res = await putPrjfilebimauditdetail(params)
          // } else {
          //   res = await postPrjfilebimauditdetail(params)
          // }
          // if (res?.data?.code === 0) {
          //   this.$message.success('保存成功')
          //   this.$emit('success')
          // }
        }
      })
    },
    deleteItem() {
      this.$confirm('是否确认删除？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'dark-theme-dialog',
      })
        .then(function () {
          // return deletePrjfilebimauditdetail(this.form.id)
        })
        .then((data) => {
          this.$message.success('删除成功')
          // this.init()
        })
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
