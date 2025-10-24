<template>
  <div>
    <el-upload
      class="avatar-uploader"
      action="#"
      :show-file-list="false"
      :before-upload="beforeAvatarUpload"
      :on-change="handleFileChange"
      ref="upload"
      accept="image/png, image/jpeg"
      :auto-upload="false"
      :multiple="false">
      <div class="image-container" v-if="imageUrl">
        <i
          class="el-icon-plus avatar-uploader-icon inner"
          @click.stop="handleUpload"
          :class="{ 'not-allowed': disabled }"></i>
        <el-image :src="imageUrl" fit="contain" :preview-src-list="[imageUrl]" @click.stop />
      </div>
      <i v-else class="el-icon-plus avatar-uploader-icon"></i>
    </el-upload>
  </div>
</template>

<script>
// import request from '@/router/axios'
export default {
  name: 'UploadFileByClipboard',
  components: {},
  props: {
    value: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      imageUrl: '',
      fileRaw: {},
    }
  },
  computed: {},
  watch: {
    value: {
      handler(val) {
        console.log(`09 val`, val)
        this.imageUrl = val
      },
      immediate: true,
    },
  },
  created() {
    this.$mitt.on('mClipboardPhotoDone', this.handleDone)
  },
  mounted() {},
  methods: {
    async handleDone(raw) {
      /*  if (raw) {
        const formData = new FormData()
        formData.append('file', raw)
        let res = await request({
          url: '/admin/sys-file/upload?bucketName=prjfilebimauditdetail',
          method: 'post',
          data: formData,
          headers: {
            Authorization: `Bearer ${this.$store.getters.access_token}`
          }
        })
        if (res.data.code === 0) {
          this.imageUrl = res.data.data.url
          console.log(`14 this.imageUrl`, this.imageUrl)
          this.$emit('input', this.imageUrl)
          return
        }
      }
      this.imageUrl = ''
      this.$emit('input', '') */
      this.imageUrl = URL.createObjectURL(raw)
      this.$emit('input', this.imageUrl)
    },
    handleUpload() {
      if (this.disabled) {
        return
      }
      console.log(`82 this.$refs.upload`, this.$refs.upload)
      this.$refs.upload.$children[0].$refs.input.click()
    },
    handleFileChange(file, fileList) {
      // 如果 fileList 的长度大于1（对于 limit="1" 的情况，通常意味着是2）
      // 这就证明用户选择了一个新文件来替换旧文件
      if (fileList.length > 1) {
        // 1. 从 fileList 中拿到最后一个文件（即刚选择的文件）
        const latestFile = fileList[fileList.length - 1]
        // 2. 手动清空整个文件列表，这会移除旧文件
        this.$refs.upload.clearFiles()
        // 3. 将新文件手动加回到文件列表中
        //    this.$refs.upload 会暴露内部方法，startUpload 是其中之一
        //    但更标准的方法是使用 handleStart
        this.$nextTick(() => {
          // 使用 nextTick 等待 clearFiles 完成
          // this.$refs.upload.handleStart(latestFile.raw)
          this.handleDone(latestFile.raw)
        })
      } else {
        this.handleDone(fileList[0].raw)
      }
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG 或 PNG 格式 !')
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!')
      }
      return (isJPG || isPNG) && isLt2M
    },
  },
}
</script>
<style scoped lang="scss">
::v-deep .el-upload {
  border: 1px dashed #d9d9d9;
}
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  cursor: not-allowed;
  border-color: #409eff;
}
.not-allowed {
  cursor: not-allowed !important;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  line-height: 78px;
  text-align: center;
}
.inner {
  position: absolute;
  z-index: 11;
  font-size: 28px;
  color: #8c939d;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
}
.image-container {
  width: 78px;
  height: 78px;
  display: flex; /* 关键：激活 Flexbox 布局 */
  justify-content: center; /* 子元素在主轴（水平）上居中 */
  align-items: center; /* 关键：子元素在交叉轴（垂直）上居中 */
  ::v-deep .el-image {
    width: 100%; /* 关键：让图片宽度占满 .image-container 的宽度 */
    height: 100%; /* 关键：让图片高度自适应，保持原始宽高比 */
  }
  img {
    width: 100%; /* 关键：让图片宽度占满 .image-container 的宽度 */
    height: 100%; /* 关键：让图片高度自适应，保持原始宽高比 */
  }
}
</style>
