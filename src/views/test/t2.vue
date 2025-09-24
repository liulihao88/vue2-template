<template>
  <g-absolute-box :customStyle="{ right: '0', top: '50%', height: 'calc(50vh - 56px)' }" title="审查列表">
    <template #right>
      <el-button type="text" icon="el-icon-plus">新增</el-button>
      <el-button type="text" icon="el-icon-close" @click="closeReview">关闭</el-button>
    </template>
    <div class="list-box">
      <!--
        这个 v-for 循环演示了一个静态数据列表。
        在实际应用中，这个 list_data 应该从 props 传入或从 API 获取。
      -->
      <div class="list-page__wrap">
        <div v-for="(item, index) in listData" :key="index" class="list-page__item">
          <!-- 左侧图片 -->
          <div class="list-page__image-container">
            <el-image :src="item.imageUrl" fit="contain"></el-image>
          </div>
          <!-- 右侧信息区 -->
          <div class="list-page__info">
            <!-- 审查类别 (上方) -->
            <h2 class="list-page__category">
              {{ item.category }}
            </h2>

            <!-- 审查批注内容 (下方) -->
            <p class="list-page__content">
              <el-tooltip :content="item.annotation" effect="dark" placement="top-start">
                <div>
                  {{ item.annotation }}
                </div>
              </el-tooltip>
            </p>
          </div>
        </div>
      </div>
    </div>
    <T3></T3>
  </g-absolute-box>
</template>

<script>
// import AbsoluteBox from './absoluteBox.vue'
import { clone } from '@/utils/gFunc'
import T3 from '@/views/test/t3.vue'
export default {
  components: {
    // AbsoluteBox,
    T3,
  },
  data() {
    return {
      listData: [
        {
          category: '设计规范',
          annotation: '此处按钮的圆角半径应为 8px，当前为 12px。这不符合我们的设计系统规范，请调整。',
          imageUrl: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
        },
        {
          category: '文案错误',
          annotation: '确认按钮的文案应为“确认提交”，目前是“确定提交”。“确认”更符合用户在提交前的最后心理暗示。',
          imageUrl: 'https://fuss10.elemecdn.com/8/27/f01c15bb73e1ef3793e64e6b7bbccjpeg.jpeg',
        },
        {
          category: '功能逻辑',
          annotation: '当用户点击“重置”按钮时，除了清空表单，不应刷新整个页面。这会中断用户的操作流，体验不佳。',
          imageUrl: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
        },
        {
          category: '用户体验',
          annotation:
            '加载动画使用了 Lottie 动画，但加载时间超过 3 秒时，未显示“预计还需 X 秒”的文字提示，容易让用户失去耐心。',
          imageUrl: 'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg',
        },
        {
          category: '用户体验',
          annotation:
            '加载动画使用了 Lottie 动画，但加载时间超过 3 秒时，未显示“预计还需 X 秒”的文字提示，容易让用户失去耐心。',
          imageUrl: 'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg',
        },
      ],
    }
  },
  created() {
    this.list = clone(this.list, 10)
  },
  methods: {
    closeReview() {
      this.$emit('closeReview')
    },
  },
}
</script>
<style lang="scss" scoped>
/* 整体页面样式 */
.list-page {
  background-color: #000000; /* 黑色背景 */
  color: #ffffff; /* 白色字体 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 20px;
}
.list-page__title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 1px;
}
.list-box {
  display: flex;
  box-sizing: border-box; /* 推荐加上，这样padding不会撑大元素 */
  height: calc(50vh - 150px);
  overflow: auto;
  flex-direction: column;
  .list-page__wrap {
    flex: 1;
  }
}
/* 列表项容器 */
.list-page__item {
  display: flex;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  height: 100px;
  margin-bottom: 8px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  border: 1px solid #333; /* 微妙的边框 */
}
.list-page__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
}
/* 图片容器 */
.list-page__image-container {
  width: 200px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333; /* 图片加载前的背景色 */
}
.list-page__image {
  width: 100%;
  height: 100%; /* 高度固定，图片会自动填充或裁剪 */
  object-fit: cover;
}
/* 右侧信息区 */
.list-page__info {
  flex-grow: 1; /* 占据所有剩余空间 */
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: space-between; /* 让类别和内容上下分布，两端对齐 */
}
/* 审查类别 (标题) */
.list-page__category {
  margin: 0 0 8px 0;
  font-weight: 500;
  font-size: 16px;
  color: #4fc3f7; /* 可以给个亮色突出一下 */
}
/* 审查批注内容 (描述) */
.list-page__content {
  margin: 0;
  line-height: 1.6;
  color: #cccccc; /* 稍微灰一点的白色，更易读 */
}
/* 响应式设计：在小屏幕上 */
@media (max-width: 600px) {
  .list-page__item {
    flex-direction: column; /* 改为上下布局 */
  }
  .list-page__image-container {
    flex: 0 0 auto; /* 宽度自适应 */
  }

  .list-page__image {
    width: 100%;
    height: 200px; /* 移动端图片可以高一些 */
  }
}
</style>
