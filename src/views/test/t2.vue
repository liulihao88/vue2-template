<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        v-for="tool in tools"
        :key="tool.name"
        @click="setTool(tool.name)"
        :class="{ active: currentTool === tool.name }">
        {{ tool.label }}
      </button>

      <!-- 颜色选择 -->
      <div class="color-picker">
        <label for="stroke-color">颜色:</label>
        <input type="color" id="stroke-color" v-model="strokeColor" @change="updateCurrentColor" />
      </div>

      <!-- 撤销/重做 -->
      <button @click="undo" :disabled="!canUndo">上一步 (Ctrl+Z)</button>
      <button @click="redo" :disabled="!canRedo">下一步 (Ctrl+Y)</button>

      <button @click="clearCanvas">清空画布</button>
    </div>

    <!-- 画布容器 -->
    <div ref="container" class="canvas-container"></div>

    <!-- 文字输入框 -->
    <div
      v-if="showTextInput"
      ref="textInputWrapper"
      class="text-input-wrapper"
      :style="{
        transform: `translate(${textInputPos.x}px, ${textInputPos.y}px)`,
        width: inputWidth + 'px',
        'font-family': textStyle.fontFamily,
        'font-size': textStyle.fontSize + 'px',
        color: textStyle.fill,
      }">
      <textarea
        ref="textInput"
        v-model="textContent"
        class="text-input"
        @input="adjustInputSize"
        @keydown.enter.shift.prevent="confirmText"
        @keydown.esc="cancelText"
        @blur="confirmText"
        @keydown="handleTextKeyDown"></textarea>
    </div>
  </div>
</template>

<script>
import Konva from 'konva'

export default {
  name: 'DrawingEditor',
  data() {
    return {
      tools: [
        { name: 'arrow', label: '箭头11' },
        { name: 'rect', label: '长方形' },
        { name: 'circle', label: '圆形' },
        { name: 'text', label: '文字' },
      ],
      currentTool: 'arrow',
      stage: null,
      layer: null,

      // 文字工具相关
      showTextInput: false,
      textContent: '',
      textInputPos: { x: 0, y: 0 },
      inputWidth: 100,
      textStyle: {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
      },
      measureCtx: null,
      editingNode: null,

      // 绘图状态
      isDrawing: false,
      tempShape: null,
      startPos: { x: 0, y: 0 },
      delayedSave: false,

      // 颜色设置
      strokeColor: '#000000',

      // 历史记录
      history: [],
      currentHistoryIndex: -1,

      // 键盘快捷键状态
      isCtrlPressed: false,
    }
  },
  computed: {
    canUndo() {
      return this.currentHistoryIndex > 0
    },
    canRedo() {
      return this.currentHistoryIndex < this.history.length - 1
    },
  },
  mounted() {
    this.initStage()
    this.initTextMeasureCtx()
    this.saveHistory()

    // 添加全局键盘事件监听器
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  },
  beforeUnmount() {
    // 移除键盘事件监听器
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  },
  methods: {
    // 初始化画布
    initStage() {
      this.stage = new Konva.Stage({
        container: this.$refs.container,
        width: 800,
        height: 600,
      })

      this.layer = new Konva.Layer()
      this.stage.add(this.layer)

      // 绑定事件
      this.stage.on('mousedown touchstart', this.handleMouseDown)
      this.stage.on('mousemove touchmove', this.handleMouseMove)
      this.stage.on('mouseup touchend', this.handleMouseUp)
      this.stage.on('click tap', this.handleCanvasClick)
    },

    initTextMeasureCtx() {
      const canvas = document.createElement('canvas')
      this.measureCtx = canvas.getContext('2d')
    },

    // 设置当前工具
    setTool(tool) {
      this.cancelText()
      this.currentTool = tool
    },

    // 更新当前颜色
    updateCurrentColor() {
      this.textStyle.fill = this.strokeColor

      // 处理选中对象的颜色
      const selectedNode = this.getSelectedNode()
      if (selectedNode) {
        selectedNode.stroke(this.strokeColor)
        if (selectedNode instanceof Konva.Text) {
          selectedNode.fill(this.strokeColor)
        }
        this.layer.batchDraw()
        this.saveHistory({ immediate: true })
      }
    },

    // 获取当前选中的节点
    getSelectedNode() {
      const selectedNodes = this.layer.find((node) => node.getAttr('isSelected'))
      return selectedNodes.length > 0 ? selectedNodes[0] : null
    },

    // ================= 绘图相关方法 =================

    handleMouseDown(e) {
      if (!this.currentTool || this.currentTool === 'text') return

      const pos = this.stage.getPointerPosition()
      if (!pos) return

      this.startPos = { x: pos.x, y: pos.y }

      // 根据工具类型创建不同的形状
      switch (this.currentTool) {
        case 'arrow':
          this.tempShape = new Konva.Arrow({
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: this.strokeColor,
            strokeWidth: 3,
            name: 'shape',
          })
          break

        case 'rect':
          this.tempShape = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            stroke: this.strokeColor,
            strokeWidth: 2,
            name: 'shape',
          })
          break

        case 'circle':
          this.tempShape = new Konva.Ellipse({
            x: pos.x,
            y: pos.y,
            radiusX: 0,
            radiusY: 0,
            stroke: this.strokeColor,
            strokeWidth: 2,
            name: 'shape',
          })
          break
      }

      if (this.tempShape) {
        this.configureShapeEvents(this.tempShape)
        this.layer.add(this.tempShape)
        this.isDrawing = true
      }
    },

    // 配置形状事件
    configureShapeEvents(node) {
      // 通用点击选择逻辑
      node.on('click tap', () => {
        this.layer.getChildren().forEach((n) => {
          n.strokeWidth(n === node ? 4 : 2)
          n.setAttr('isSelected', n === node)
        })
        this.layer.batchDraw()
      })

      // 拖拽/变换保存历史
      const saveHandler = () => {
        if (!this._loadingHistory) {
          this.saveHistory()
        }
      }

      node.on('dragend transformend', saveHandler)

      // 文本双击编辑
      if (node instanceof Konva.Text) {
        node.on('dblclick', () => {
          const pos = node.position()
          this.editingNode = node
          this.openTextInput(pos.x, pos.y, node.text())
        })
      }
    },
    handleMouseMove(e) {
      if (!this.isDrawing || !this.tempShape) return

      const pos = this.stage.getPointerPosition()
      if (!pos) return

      // 根据工具类型更新形状
      switch (this.currentTool) {
        case 'arrow':
          this.tempShape.points([this.startPos.x, this.startPos.y, pos.x, pos.y])
          break

        case 'rect':
          this.tempShape.width(pos.x - this.startPos.x)
          this.tempShape.height(pos.y - this.startPos.y)
          break

        case 'circle':
          const dx = pos.x - this.startPos.x
          const dy = pos.y - this.startPos.y
          this.tempShape.radiusX(Math.abs(dx))
          this.tempShape.radiusY(Math.abs(dy))
          break
      }

      this.layer.batchDraw()
    },

    handleMouseUp() {
      if (this.isDrawing && this.tempShape) {
        let isValidShape = false

        // 检查形状是否有有效大小
        switch (this.currentTool) {
          case 'arrow':
            isValidShape = !(
              this.tempShape.points()[0] === this.tempShape.points()[2] &&
              this.tempShape.points()[1] === this.tempShape.points()[3]
            )
            break
          case 'rect':
            isValidShape = Math.abs(this.tempShape.width() * this.tempShape.height()) > 10
            break
          case 'circle':
            isValidShape = this.tempShape.radiusX() > 5 && this.tempShape.radiusY() > 5
            break
        }

        if (isValidShape) {
          this.saveHistory({ immediate: true })
        } else {
          this.tempShape.destroy()
        }
      }

      this.isDrawing = false
      this.tempShape = null

      // 处理延迟保存
      if (this.delayedSave) {
        this.saveHistory({ immediate: true })
      }
    },

    handleCanvasClick(e) {
      if (this.currentTool !== 'text' || this.showTextInput) return

      // 如果点击的是现有文本节点，则进入编辑模式
      if (e.target instanceof Konva.Text) {
        const pos = e.target.position()
        const text = e.target.text()
        this.editingNode = e.target
        this.openTextInput(pos.x, pos.y, text)
        return
      }

      // 否则创建新文本
      const pos = this.stage.getPointerPosition()
      if (!pos) return

      this.openTextInput(pos.x, pos.y)
    },

    // ================= 文字工具相关方法 =================

    /**
     * 打开文字输入框（核心修复）
     * @param {number} x 点击的X坐标（相对于画布）
     * @param {number} y 点击的Y坐标（相对于画布）
     * @param {string} existingText 现有文本（编辑时传入）
     */
    openTextInput(x, y, existingText = '') {
      // 1. 获取画布容器在页面中的绝对位置
      const containerRect = this.$refs.container.getBoundingClientRect()

      // 2. 计算输入框应该显示的位置（画布坐标 + 容器偏移）
      this.textInputPos = {
        x: x + containerRect.left - window.scrollX,
        y: y + containerRect.top - window.scrollY,
      }

      // 3. 设置初始内容
      this.textContent = existingText
      this.inputWidth = Math.max(100, existingText.length * 8) // 根据文字长度动态调整

      // 4. 显示输入框并聚焦
      this.showTextInput = true

      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        textarea.focus()

        // 如果是编辑现有文本，全选文本方便修改
        if (existingText) {
          textarea.setSelectionRange(0, existingText.length)
        }

        this.adjustInputSize()
      })
    },

    adjustInputSize() {
      if (!this.measureCtx || !this.$refs.textInput) return

      // 计算文本宽度
      this.measureCtx.font = `${this.textStyle.fontSize}px ${this.textStyle.fontFamily}`
      const testText = this.textContent || ' '
      const textWidth = this.measureCtx.measureText(testText).width

      // 确保最小宽度和限制最大宽度不超过画布
      const maxWidth = this.stage.width() - this.textInputPos.x - 10
      this.inputWidth = Math.min(
        Math.max(textWidth + 20, 100), // 最小100px
        maxWidth,
      )

      // 调整高度（无滚动条）
      const textarea = this.$refs.textInput
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    },

    // 文字输入框键盘事件处理
    handleTextKeyDown(e) {
      // 处理撤销/重做快捷键
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        this.undo()
        e.preventDefault()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        this.redo()
        e.preventDefault()
      }
    },

    // 确认文本
    confirmText() {
      if (this.textContent.trim()) {
        // 如果是编辑现有文本，先删除旧的
        if (this.editingNode) {
          this.editingNode.destroy()
          this.editingNode = null
        }

        this.createTextNode(this.textInputPos.x, this.textInputPos.y, this.textContent)
      }

      this.cancelText()
      this.saveHistory({ immediate: true })
    },

    // 取消输入
    cancelText() {
      this.showTextInput = false
      this.textContent = ''
      this.editingNode = null
    },

    // 创建文本节点
    createTextNode(x, y, text) {
      const textNode = new Konva.Text({
        x,
        y,
        text,
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
        fill: this.strokeColor,
        draggable: true,
        name: 'text',
      })

      // 双击编辑
      textNode.on('dblclick', () => {
        const pos = textNode.position()
        this.editingNode = textNode
        this.openTextInput(pos.x, pos.y, textNode.text())
      })

      // 选中效果
      textNode.on('click tap', () => {
        this.layer.find('.shape, .text').forEach((node) => {
          if (node !== textNode) {
            if (node instanceof Konva.Text) {
              node.strokeWidth(0)
            } else {
              node.strokeWidth(2)
            }
            node.setAttr('isSelected', false)
          }
        })

        textNode.stroke(this.strokeColor)
        textNode.strokeWidth(2)
        textNode.setAttr('isSelected', true)
        this.layer.batchDraw()
      })

      // 拖拽和变换事件
      textNode.on('transformend', () => this.saveHistory({ immediate: true }))
      textNode.on('dragend', () => this.saveHistory({ immediate: true }))

      this.layer.add(textNode)
      this.layer.batchDraw()
    },

    // ================= 撤销/重做功能 =================

    /**
     * 保存当前画布状态到历史记录
     */
    saveHistory() {
      // 防止在加载历史时保存
      if (this._loadingHistory) return

      // 1. 获取当前画布的JSON表示（简化版）
      const snapshot = this.serializeStage()

      // 2. 如果当前位置不是历史记录的末尾，则截断后面的记录
      if (this.currentHistoryIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentHistoryIndex + 1)
      }

      // 3. 检查是否与上一个状态相同（避免重复保存）
      if (this.history.length > 0) {
        const lastState = this.history[this.history.length - 1]
        if (JSON.stringify(lastState) === JSON.stringify(snapshot)) {
          return
        }
      }

      // 4. 保存新状态
      this.history.push(snapshot)
      this.currentHistoryIndex = this.history.length - 1

      // 5. 限制历史记录数量（最多50条）
      if (this.history.length > 50) {
        this.history.shift()
        this.currentHistoryIndex--
      }
    },

    /**
     * 序列化画布状态（去除不必要的数据）
     */
    serializeStage() {
      const shapes = []
      this.layer.getChildren().forEach((node) => {
        // 基本属性
        const shape = {
          id: node.id(),
          type: node.getClassName(),
          attrs: {
            x: node.x(),
            y: node.y(),
            width: node.width?.(),
            height: node.height?.(),
            radius: node.radius?.(),
            points: node.points?.(),
            stroke: node.stroke(),
            strokeWidth: node.strokeWidth(),
            fill: node.fill?.(),
            draggable: node.draggable(),
            isSelected: node.getAttr('isSelected'),
          },
        }

        // 特殊处理文本节点
        if (node instanceof Konva.Text) {
          shape.attrs.text = node.text()
          shape.attrs.fontSize = node.fontSize()
          shape.attrs.fontFamily = node.fontFamily()
        }

        shapes.push(shape)
      })

      return {
        shapes,
        stageSize: {
          width: this.stage.width(),
          height: this.stage.height(),
        },
      }
    },

    /**
     * 加载历史状态（核心修复）
     */
    loadHistory() {
      if (
        this.history.length === 0 ||
        this.currentHistoryIndex < 0 ||
        this.currentHistoryIndex >= this.history.length
      ) {
        return
      }

      // 设置加载锁防止递归
      if (this._loadingHistory) return
      this._loadingHistory = true

      try {
        // 1. 获取要加载的历史数据
        const historyData = this.history[this.currentHistoryIndex]
        console.log(`98 historyData`, historyData)

        // 2. 取消所有当前操作
        this.cancelText()
        this.isDrawing = false
        if (this.tempShape) {
          this.tempShape.destroy()
          this.tempShape = null
        }

        // 3. 清空当前图层
        this.layer.destroyChildren()

        // 4. 重建所有形状（不使用Node.create）
        console.log(`69 historyData.shapes`, historyData.shapes)
        historyData.shapes.forEach((shapeData) => {
          this.recreateShape(shapeData)
        })

        // 5. 恢复舞台尺寸
        console.log(`49 this.stage`, this.stage)
        this.stage.width(historyData.stageSize.width)
        this.stage.height(historyData.stageSize.height)

        this.layer.batchDraw()
      } catch (error) {
        console.error('历史记录加载失败111:', error)

        // 紧急恢复：重置到最后一次正确状态
        // this.resetToLastGoodState()
      } finally {
        this._loadingHistory = false
      }
    },

    /**
     * 手动重建形状（避免使用Node.create）
     */
    recreateShape(shapeData) {
      let shape

      switch (shapeData.type) {
        case 'Arrow':
          shape = new Konva.Arrow({
            points: shapeData.attrs.points,
            stroke: shapeData.attrs.stroke,
            strokeWidth: shapeData.attrs.strokeWidth,
            fill: shapeData.attrs.fill,
            draggable: shapeData.attrs.draggable,
            id: shapeData.id,
          })
          break

        case 'Rect':
          shape = new Konva.Rect({
            x: shapeData.attrs.x,
            y: shapeData.attrs.y,
            width: shapeData.attrs.width,
            height: shapeData.attrs.height,
            stroke: shapeData.attrs.stroke,
            strokeWidth: shapeData.attrs.strokeWidth,
            fill: shapeData.attrs.fill,
            draggable: shapeData.attrs.draggable,
            id: shapeData.id,
          })
          break

        case 'Circle':
          shape = new Konva.Circle({
            x: shapeDataattrs.x,
            y: shapeData.attrs.y,
            radius: shapeData.attrs.radius,
            stroke: shapeData.attrs.stroke,
            strokeWidth: shapeData.attrs.strokeWidth,
            fill: shapeData.attrs.fill,
            draggable: shapeData.attrs.draggable,
            id: shapeData.id,
          })
          break

        case 'Text':
          shape = new Konva.Text({
            x: shapeData.attrs.x,
            y: shapeData.attrs.y,
            text: shapeData.attrs.text,
            fontSize: shapeData.attrs.fontSize,
            fontFamily: shapeData.attrs.fontFamily,
            fill: shapeData.attrs.fill,
            draggable: shapeData.attrs.draggable,
            id: shapeData.id,
          })
          break

        default:
          // 默认创建Group作为兜底
          shape = new Konva.Group({
            id: shapeData.id,
            draggable: shapeData.attrs.draggable,
          })
      }

      // 恢复选中状态
      if (shapeData.attrs.isSelected) {
        shape.strokeWidth(4)
        shape.setAttr('isSelected', true)
      }

      // 重新绑定事件
      this.configureShapeEvents(shape)

      // 添加到图层
      this.layer.add(shape)

      return shape
    },

    /**
     * 紧急恢复机制
     */
    resetToLastGoodState() {
      // 1. 清空无效历史记录
      if (this.currentHistoryIndex >= this.history.length) {
        this.currentHistoryIndex = this.history.length - 1
      }

      // 2. 如果当前状态无效，尝试回退
      if (this.currentHistoryIndex < 0 && this.history.length > 0) {
        this.currentHistoryIndex = 0
      }

      // 3. 简单重绘（不尝试再次加载历史）
      this.layer.draw()
    },

    /**
     * 撤销操作
     */
    undo() {
      if (!this.canUndo) return

      // 1. 移动到上一个历史点
      this.currentHistoryIndex--

      // 2. 延迟加载确保状态稳定
      this.$nextTick(() => {
        this.loadHistory()
      })
    },

    /**
     * 重做操作
     */
    redo() {
      if (!this.canRedo) return

      // 1. 移动到下一个历史点
      this.currentHistoryIndex++

      // 2. 延迟加载确保状态稳定
      this.$nextTick(() => {
        this.loadHistory()
      })
    },

    // 清空画布
    clearCanvas() {
      this.layer.destroyChildren()
      this.layer.draw()
      this.cancelText()
      this.saveHistory({ immediate: true })
    },

    // ================= 键盘事件处理 =================

    handleMouseDown(e) {
      if (!this.currentTool || this.currentTool === 'text') return

      const pos = this.stage.getPointerPosition()
      if (!pos) return

      this.startPos = { x: pos.x, y: pos.y }

      // 根据工具类型创建不同的形状
      switch (this.currentTool) {
        case 'arrow':
          this.tempShape = new Konva.Arrow({
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: this.strokeColor,
            strokeWidth: 3,
            name: 'arrow',
          })
          break

        case 'rect':
          this.tempShape = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            stroke: this.strokeColor,
            strokeWidth: 2,
            name: 'rect',
          })
          break

        case 'circle':
          this.tempShape = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 0,
            stroke: this.strokeColor,
            strokeWidth: 2,
            name: 'circle',
          })
          break
      }

      if (this.tempShape) {
        // 添加拖拽选择功能
        this.tempShape.draggable(true)
        this.tempShape.on('click tap', (e) => {
          // 取消其他节点的选中状态
          this.layer
            .find((node) => node.name())
            .forEach((node) => {
              if (node !== e.target) {
                node.strokeWidth(2)
              }
            })

          // 高亮选中的节点
          e.target.strokeWidth(4)
          this.layer.batchDraw()
        })

        this.layer.add(this.tempShape)
        this.isDrawing = true
      }
    },

    handleMouseMove(e) {
      if (!this.isDrawing || !this.tempShape) return

      const pos = this.stage.getPointerPosition()
      if (!pos) return

      // 根据工具类型更新形状
      switch (this.currentTool) {
        case 'arrow':
          this.tempShape.points([this.startPos.x, this.startPos.y, pos.x, pos.y])
          break

        case 'rect':
          this.tempShape.width(pos.x - this.startPos.x)
          this.tempShape.height(pos.y - this.startPos.y)
          break

        case 'circle':
          const dx = pos.x - this.startPos.x
          const dy = pos.y - this.startPos.y
          this.tempShape.radius(Math.sqrt(dx * dx + dy * dy))
          break
      }

      this.layer.batchDraw()
    },

    handleMouseUp() {
      if (this.isDrawing && this.tempShape) {
        // 确保形状有大小（防止误操作创建不可见的形状）
        if (
          (this.currentTool === 'arrow' &&
            (this.tempShape.points()[0] !== this.tempShape.points()[2] ||
              this.tempShape.points()[1] !== this.tempShape.points()[3])) ||
          (this.currentTool === 'rect' && this.tempShape.width() * this.tempShape.height() > 0) ||
          (this.currentTool === 'circle' && this.tempShape.radius() > 0)
        ) {
          this.saveHistory()
        } else {
          this.tempShape.destroy()
        }
      }

      this.isDrawing = false
      this.tempShape = null
    },

    /**
     * 点击画布时处理文字工具
     */
    handleCanvasClick(e) {
      if (this.currentTool !== 'text' || this.showTextInput) return

      // 获取点击位置（相对于画布）
      const pos = this.stage.getPointerPosition()
      if (!pos) return

      // 1. 如果点击的是现有文本节点 -> 编辑
      if (e.target instanceof Konva.Text) {
        const textNode = e.target
        const textPos = textNode.position()
        textNode.destroy() // 先删除旧节点
        this.openTextInput(textPos.x, textPos.y, textNode.text())
        return
      }

      // 2. 点击空白处 -> 新建文本
      this.openTextInput(pos.x, pos.y)
    },

    // ================= 文字工具相关方法 =================

    openTextInput(x, y, existingText = '') {
      this.textInputPos = { x, y }
      this.textContent = existingText
      this.inputWidth = 100 // 初始宽度
      this.showTextInput = true

      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        textarea.focus()

        // 如果有现有文本，全选以便直接修改
        if (existingText) {
          textarea.setSelectionRange(0, existingText.length)
        }

        // 初始化调整大小
        this.adjustInputSize()
      })
    },

    adjustInputSize() {
      if (!this.measureCtx || !this.$refs.textInput) return

      // 计算文本宽度
      this.measureCtx.font = `${this.textStyle.fontSize}px ${this.textStyle.fontFamily}`
      const testText = this.textContent || ' '
      const textWidth = this.measureCtx.measureText(testText).width

      // 确保最小宽度和限制最大宽度不超过画布
      const maxWidth = this.stage.width() - this.textInputPos.x - 10
      this.inputWidth = Math.min(
        Math.max(textWidth + 20, 100), // 最小100px
        maxWidth,
      )

      // 调整高度（无滚动条）
      const textarea = this.$refs.textInput
      textarea.style.height = 'auto'
      textarea.style.overflow = 'hidden'
      textarea.style.height = textarea.scrollHeight + 'px'
    },

    // 文字输入框键盘事件处理
    handleTextKeyDown(e) {
      // 按下Ctrl键时标记状态
      if (e.ctrlKey || e.metaKey) {
        this.isCtrlPressed = true

        // 处理撤销/重做快捷键
        if (e.key === 'z' || e.key === 'Z') {
          this.undo()
        } else if (e.key === 'y' || e.key === 'Y') {
          this.redo()
        }
      }
    },

    // 确认文本
    confirmText() {
      if (this.textContent.trim()) {
        this.createTextNode(this.textInputPos.x, this.textInputPos.y, this.textContent)
      }
      this.cancelText()
    },

    // 取消输入
    cancelText() {
      this.showTextInput = false
      this.textContent = ''
    },

    // 创建文本节点
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
      })

      // 双击编辑
      textNode.on('dblclick', () => {
        const pos = textNode.position()
        this.openTextInput(pos.x, pos.y, textNode.text())
        textNode.destroy()
      })

      // 选中效果
      textNode.on('click tap', () => {
        this.layer
          .find((node) => node.name())
          .forEach((node) => {
            if (node instanceof Konva.Text) node.fontSize(this.textStyle.fontSize)
            if (node !== textNode) node.strokeWidth(2)
          })

        textNode.stroke(this.strokeColor)
        textNode.strokeWidth(2)
        this.layer.batchDraw()
      })

      this.layer.add(textNode)
      this.layer.batchDraw()
      this.saveHistory()
    },

    // ================= 撤销/重做功能 =================

    // 清空画布
    clearCanvas() {
      this.layer.destroyChildren()
      this.layer.draw()
      this.cancelText()
      this.saveHistory()
    },

    // ================= 键盘事件处理 =================

    handleKeyDown(e) {
      // 标记Ctrl键按下状态
      if (e.ctrlKey || e.metaKey) {
        this.isCtrlPressed = true

        // 处理撤销/重做快捷键
        if (e.key === 'z' || e.key === 'Z') {
          this.undo()
          e.preventDefault()
        } else if (e.key === 'y' || e.key === 'Y') {
          this.redo()
          e.preventDefault()
        }
      }
    },

    handleKeyUp(e) {
      if (e.key === 'Control' || e.key === 'Meta') {
        this.isCtrlPressed = false
      }
    },
  },
}
</script>

<style scoped>
.editor-container {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.toolbar button {
  padding: 6px 12px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  background-color: #eee;
}

.toolbar button.active {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-picker input[type='color'] {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.canvas-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 800px;
  height: 600px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-input-wrapper {
  position: fixed; /* 改为fixed定位，不受父元素影响 */
  z-index: 1000; /* 确保在最顶层 */
  transform: none; /* 移除transform */
  left: 0;
  top: 0;
  margin-left: var(--x); /* 将通过style动态设置 */
  margin-top: var(--y); /* 将通过style动态设置 */
}

.text-input {
  width: 100%;
  border: 2px solid #3498db;
  border-radius: 4px;
  padding: 8px;
  outline: none;
  resize: none;
  overflow: hidden !important;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1.5;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: #2980b9;
  box-shadow: 0;
}
</style>
