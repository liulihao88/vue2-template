<template>
  <div>
    <h2>工具栏</h2>
    <div class="tools-container">
      <!--
        这行代码就应用在这里。
        v-for 遍历 tools 数组中的每一个 tool 对象。
        对每个按钮，它会进行 class 绑定。
      -->
      <div
        v-for="tool in tools"
        :key="tool.name"
        class="tool-item"
        :class="[currentTool === tool.name && 'active', tool.className]"
        @click="selectTool(tool.name)">
        <!-- 图标或工具名称 -->
        {{ tool.label }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 当前选中的工具名称
      currentTool: 'select',
      // 所有可用的工具列表
      tools: [
        { name: 'select', label: '选择', className: 'tool-select-icon' },
        { name: 'brush', label: '画笔', className: 'tool-brush-icon' },
        { name: 'eraser', label: '橡皮擦', className: 'tool-eraser-icon' },
      ],
    }
  },
  methods: {
    // 当用户点击工具时，更新 currentTool
    selectTool(toolName) {
      this.currentTool = toolName
      console.log('已切换到工具:', toolName)
    },
  },
}
</script>

<style scoped>
.tools-container {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.tool-item {
  padding: 10px 15px;
  border: 1px solid #999;
  border-radius: 5px;
  cursor: pointer;
  /* 这是工具每个项的基础样式 */
}
</style>
