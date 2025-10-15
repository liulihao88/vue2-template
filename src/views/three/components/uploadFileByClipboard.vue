<template>
  <div>
    <el-upload
      class="avatar-uploader"
      action="https://jsonplaceholder.typicode.com/posts/"
      :show-file-list="false"
      disabled
      :before-upload="beforeAvatarUpload">
      <div class="image-container" v-if="imageUrl">
        <el-image :src="imageUrl" fit="contain" :preview-src-list="[imageUrl]" />
      </div>
      <i v-else class="el-icon-plus avatar-uploader-icon" disabled></i>
    </el-upload>
  </div>
</template>

<script>
export default {
  name: 'GUploadFile',
  components: {},
  props: {
    value: {
      type: String,
      required: true,
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
    this.$mitt.on('mClipboardPhotoDone', (url) => {
      if (url) {
        this.fileRaw = url
        this.imageUrl = URL.createObjectURL(url)
      } else {
        this.fileRaw = ''
        this.imageUrl = ''
      }
    })
  },
  mounted() {},
  methods: {
    beforeAvatarUpload(file) {
      console.log(`67 file.type`, file.type)
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
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  line-height: 78px;
  text-align: center;
  cursor: not-allowed;
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
