// 在 methods 中替换原有文字相关方法
methods: {
  // ... 其他方法保持不变 ...

  /**
   * 打开文字输入框（核心修复）
   * @param {number} x 点击的X坐标（相对于画布）
   * @param {number} y 点击的Y坐标（相对于画布）
   * @param {string} existingText 现有文本（编辑时传入）
   */
  openTextInput(x, y, existingText = '') {
    // 1. 获取画布容器在页面中的绝对位置
    const containerRect = this.$refs.container.getBoundingClientRect();

    // 2. 计算输入框应该显示的位置（画布坐标 + 容器偏移）
    this.textInputPos = {
      x: x + containerRect.left - window.scrollX,
      y: y + containerRect.top - window.scrollY
    };

    // 3. 设置初始内容
    this.textContent = existingText;
    this.inputWidth = Math.max(100, existingText.length * 8); // 根据文字长度动态调整

    // 4. 显示输入框并聚焦
    this.showTextInput = true;

    this.$nextTick(() => {
      const textarea = this.$refs.textInput;
      textarea.focus();

      // 如果是编辑现有文本，全选文本方便修改
      if (existingText) {
        textarea.setSelectionRange(0, existingText.length);
      }

      this.adjustInputSize();
    });
  },

  /**
   * 点击画布时处理文字工具
   */
  handleCanvasClick(e) {
    if (this.currentTool !== 'text' || this.showTextInput) return;

    // 获取点击位置（相对于画布）
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    // 1. 如果点击的是现有文本节点 -> 编辑
    if (e.target instanceof Konva.Text) {
      const textNode = e.target;
      const textPos = textNode.position();
      textNode.destroy(); // 先删除旧节点
      this.openTextInput(textPos.x, textPos.y, textNode.text());
      return;
    }

    // 2. 点击空白处 -> 新建文本
    this.openTextInput(pos.x, pos.y);
  },

  /**
   * 创建文本节点（添加位置修复）
   */
  createTextNode(x, y, text) {
    const textNode = new Konva.Text({
      x: x,
      y: y, // 精确使用点击位置
      text: text,
      fontSize: this.textStyle.fontSize,
      fontFamily: this.textStyle.fontFamily,
      fill: this.strokeColor,
      draggable: true,
      name: 'text',
    });

    // ... 原有的事件绑定保持不变 ...

    this.layer.add(textNode);
    this.layer.batchDraw();
    this.saveHistory();
  }
}
