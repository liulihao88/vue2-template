<!-- src/components/CanvasDownloader.vue -->
<template>
  <button
    class="download-btn"
    @click="handleDownload"
    :disabled="isDownloading">
    {{ isDownloading ? '生成中...' : '下载画布' }}
  </button>
</template>

<script>
// Konva 的引入通常在父组件，但这里直接使用，确保逻辑清晰
import Konva from 'konva';

export default {
  name: 'CanvasDownloader',

  // 定义组件接收的 props
  props: {
    // 接收来自父组件的 Konva Stage 实例
    stageInstance: {
      type: Object,
      required: true,
    }
  },

  // 组件的初始数据
  data() {
    return {
      isDownloading: false, // 控制下载按钮的加载状态
    };
  },

  // 组件的方法
  methods: {
    /**
     * 处理下载逻辑
     */
    handleDownload() {
      // 如果stage不存在或正在下载中，则不执行任何操作
      if (!this.stageInstance || this.isDownloading) {
        return;
      }

      // 设置下载中状态，防止用户重复点击
      this.isDownloading = true;

      try {
        // 1. 将 Konva Stage 转换为 data URL (base64 图片)
        const dataURL = this.stageInstance.toDataURL({
          pixelRatio: 2, // 提高导出图片的分辨率，避免模糊
          quality: 0.9, // 图片质量，0.0 到 1.0
        });

        // 2. 创建一个临时的 <a> 标签用于下载
        const link = document.createElement('a');
        link.href = dataURL;

        // 3. 设置下载的文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `canvas-snapshot-${timestamp}.png`;

        // 4. 模拟点击该链接，触发浏览器下载
        document.body.appendChild(link); // 必须先添加到 body
        link.click();

        // 5. 下载完成后，移除临时的 <a> 标签
        document.body.removeChild(link);

      } catch (error) {
        console.error('截图下载失败:', error);
        // 在实际项目中，这里可以调用 this.$notify.error() 或使用 Vue-Toastification 等提示库
        alert('截图失败，请重试！');
      } finally {
        // 6. 无论成功或失败，都重置下载状态
        this.isDownloading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Scoped 样式只作用于当前组件的元素 */
.download-btn {
  padding: 6px 12px;
  background-color: #28a745; /* 绿色按钮，符合下载功能 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.download-btn:hover {
  background-color: #218838;
}

.download-btn:active {
  transform: scale(0.98);
}

.download-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: scale(1);
}
</style>
