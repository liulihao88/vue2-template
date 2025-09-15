<template>
  <div>
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="setTool('arrow')" :class="{ active: currentTool === 'arrow' }">箭头</button>
      <button @click="setTool('circle')" :class="{ active: currentTool === 'circle' }">圆形</button>
      <button @click="setTool('text')" :class="{ active: currentTool === 'text' }">文字</button>
      <button @click="clearCanvas">清空画布</button>
    </div>

    <!-- 画布容器 -->
    <div ref="container" class="canvas-container"></div>

    <!-- 动态宽度输入框（无滚动条） -->
    <div
      v-if="showTextInput"
      ref="textInputWrapper"
      class="text-input-wrapper"
      :style="{
        transform: `translate(${textInputPos.x}px, ${textInputPos.y}px)`,
        width: inputWidth + 'px',
        'font-family': textStyle.fontFamily,
        'font-size': textStyle.fontSize + 'px',
        color: textStyle.fill
      }"
    >
      <textarea
        ref="textInput"
        v-model="textContent"
        class="text-input"
        @input="adjustInputSize"
        @keydown.enter.shift.prevent="confirmText"
        @keydown.esc="cancelText"
        @blur="confirmText"
      ></textarea>
    </div>
  </div>
</template>

<script>
import Konva from "konva";

export default {
  name: "CanvasEditor",
  data() {
    return {
      currentTool: null,  // 'arrow' | 'circle' | 'text'
      stage: null,
      layer: null,
      showTextInput: false,
      textContent: "",
      textInputPos: { x: 0, y: 0 },  // 输入框位置
      inputWidth: 100,  // 初始宽度
      textStyle: {
        fontSize: 16,
        fontFamily: "Arial",
        fill: "#000"  // 字体颜色
      },
      measureCtx: null,  // 用于测量文本宽度的 Canvas 上下文
      isDrawing: false,
      tempShape: null,
      startPos: { x: 0, y: 0 }
    };
  },
  mounted() {
    this.initStage();
    this.initTextMeasureCtx();
  },
  methods: {
    // 初始化画布
    initStage() {
      this.stage = new Konva.Stage({
        container: this.$refs.container,
        width: 800,
        height: 600
      });
      this.layer = new Konva.Layer();
      this.stage.add(this.layer);

      // 绑定鼠标事件
      this.stage.on("mousedown touchstart", this.handleMouseDown);
      this.stage.on("mousemove touchmove", this.handleMouseMove);
      this.stage.on("mouseup touchend", this.handleMouseUp);
      this.stage.on("click tap", this.handleCanvasClick);
    },

    // 初始化文本测量 Canvas
    initTextMeasureCtx() {
      const canvas = document.createElement("canvas");
      this.measureCtx = canvas.getContext("2d");
    },

    // 设置当前工具
    setTool(tool) {
      this.currentTool = tool;
    },

    // 清空画布
    clearCanvas() {
      this.layer.destroyChildren();
      this.layer.draw();
      this.cancelText();
    },

    // ========== 绘图工具 ==========
    handleMouseDown(e) {
      if (!this.currentTool || this.currentTool === "text") return;

      const pos = this.stage.getPointerPosition();
      this.startPos = { x: pos.x, y: pos.y };

      if (this.currentTool === "arrow") {
        this.tempShape = new Konva.Arrow({
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: "blue",
          strokeWidth: 3
        });
      } else if (this.currentTool === "circle") {
        this.tempShape = new Konva.Circle({
          x: pos.x,
          y: pos.y,
          radius: 0,
          stroke: "red",
          strokeWidth: 2
        });
      }

      this.layer.add(this.tempShape);
      this.isDrawing = true;
    },

    handleMouseMove(e) {
      if (!this.isDrawing || !this.tempShape) return;

      const pos = this.stage.getPointerPosition();

      if (this.currentTool === "arrow") {
        this.tempShape.points([this.startPos.x, this.startPos.y, pos.x, pos.y]);
      } else if (this.currentTool === "circle") {
        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;
        this.tempShape.radius(Math.sqrt(dx * dx + dy * dy));
      }

      this.layer.batchDraw();
    },

    handleMouseUp() {
      this.isDrawing = false;
      this.tempShape = null;
    },

    // ========== 文字工具 ==========
    handleCanvasClick(e) {
      if (this.currentTool !== "text" || this.showTextInput) return;

      const pos = this.stage.getPointerPosition();
      this.openTextInput(pos.x, pos.y);
    },

    // 打开输入框
    openTextInput(x, y) {
      this.textInputPos = { x, y };
      this.textContent = "";
      this.inputWidth = 100;  // 初始宽度
      this.showTextInput = true;

      this.$nextTick(() => {
        this.$refs.textInput.focus();
      });
    },

    // 调整输入框宽度和高度（无滚动条）
    adjustInputSize() {
      if (!this.measureCtx || !this.$refs.textInput) return;

      // 计算文本宽度
      this.measureCtx.font = `${this.textStyle.fontSize}px ${this.textStyle.fontFamily}`;
      const testText = this.textContent || " ";
      const textWidth = this.measureCtx.measureText(testText).width;

      // 限制在画布范围内
      const maxWidth = this.stage.width() - this.textInputPos.x - 10;
      this.inputWidth = Math.min(
        Math.max(textWidth + 20, 100),  // 最小 100px
        maxWidth
      );

      // 调整高度（无滚动条）
      const textarea = this.$refs.textInput;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      textarea.style.overflow = "hidden";
    },

    // 确定文本
    confirmText() {
      if (this.textContent.trim()) {
        this.createTextNode(
          this.textInputPos.x,
          this.textInputPos.y,
          this.textContent
        );
      }
      this.cancelText();
    },

    // 取消输入
    cancelText() {
      this.showTextInput = false;
      this.textContent = "";
    },

    // 创建文本节点（双击可编辑）
    createTextNode(x, y, text) {
      const textNode = new Konva.Text({
        x,
        y,
        text,
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
        fill: this.textStyle.fill,
        draggable: true  // 可拖动
      });

      // 双击编辑
      textNode.on("dblclick", () => {
        const pos = textNode.position();
        this.openTextInput(pos.x, pos.y);
        textNode.destroy();
      });

      this.layer.add(textNode);
      this.layer.draw();
    }
  }
};
</script>

<style scoped>
.toolbar {
  margin-bottom: 10px;
}
button {
  margin-right: 5px;
  padding: 5px 10px;
  cursor: pointer;
}
button.active {
  background: #3498db;
  color: white;
}
.canvas-container {
  border: 1px solid #ccc;
  width: 800px;
  height: 600px;
  position: relative;
  overflow: hidden;
}
.text-input-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100px;
  max-width: 100%;
  z-index: 100;
  transform-origin: left top;
}
.text-input {
  width: 100%;
  border: 2px solid #3498db;
  border-radius: 4px;
  padding: 8px;
  outline: none;
  background: white;
  resize: none;
  box-sizing: border-box;
  overflow: hidden !important;  /* 确保无滚动条 */
  line-height: 1.5;
}
.text-input:focus {
  border-color: #2980b9;
  box-shadow: 0 0 5px rgba(41, 128, 185, 0.5);
}
</style>
