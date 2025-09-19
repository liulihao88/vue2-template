<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div
        v-for="tool in tools"
        :key="tool.name"
        size="small"
        class="anno-btn bim-button bim-button myfont"
        :class="[currentTool === tool.name && 'active', tool.className]"
        :title="tool.label"
        @click="setTool(tool.name)">
        <!-- {{ tool.label }} -->
      </div>

      <!-- 颜色选择 -->
      <div class="anno-btn bim-button bim-button myfont color-picker">
        <input type="color" id="stroke-color" v-model="strokeColor" @change="updateCurrentColor" />
      </div>

      <!-- 撤销/重做 -->
      <div class="anno-btn bim-button bim-button myfont" :class="[canUndo && 'active']">
        <svg-icon iconClass="iconprev" class="" :disabled="!canUndo" @click="undo"></svg-icon>
      </div>
      <div class="anno-btn bim-button bim-button myfont" :class="[canRedo && 'active']">
        <svg-icon iconClass="iconnext" :disabled="!canRedo" @click="redo"></svg-icon>
      </div>
      <div class="anno-btn bim-button bim-button myfont">
        <svg-icon
          iconClass="delete"
          class="anno-btn bim-button bim-button myfont iconjiantou"
          @click="clearCanvas"></svg-icon>
      </div>
      <!-- <button @click="undo" :disabled="!canUndo">上一步</button> -->
      <!-- <button @click="redo" :disabled="!canRedo">下一步</button> -->

      <!-- <button @click="clearCanvas">清空</button> -->
    </div>

    <!-- 画布容器 -->
    <div ref="containerRef" class="full-screen-overlay">
      <!-- <canvas ref="konvaCanvas" ></canvas> -->
    </div>

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
        { name: 'arrow', label: '箭头', className: 'iconjiantou' },
        { name: 'rect', label: '矩形', className: 'iconjuxingkuang' },
        { name: 'circle', label: '圆形', className: 'iconyuan' },
        { name: 'text', label: '文字', className: 'iconwenzi' },
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
      strokeColor: '#ff0000',

      // 历史记录
      history: [],
      currentHistoryIndex: -1,

      // 键盘快捷键状态
      isCtrlPressed: false,
      textInsertStageX: 0, // 新增
      textInsertStageY: 0, // 新增
      isInteracting: true,
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
  created() {
    this.$mitt.on('can-draw', this.stopOrStartDraw)
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
    stopOrStartDraw(bool) {
      console.log(`28 bool`, bool)
      this.isInteracting = bool
      if (!bool) {
        this.cancelText()
        this.currentTool = ''
      }
    },
    // 初始化画布
    initStage() {
      const $containerRef = this.$refs.containerRef
      const canvas = this.$refs.konvaCanvas
      console.log(`57 canvas`, canvas)
      console.log(`61 $containerRef`, $containerRef)
      // 获取容器的 CSS 尺寸
      const width = $containerRef.clientWidth
      console.log(`31 width`, width)
      const height = $containerRef.clientHeight
      console.log(`85 height`, height)

      if ($containerRef) {
        this.stage = new Konva.Stage({
          container: $containerRef,
          width: width,
          height: height,
          draggable: false,
          pixelRatio: 1.0,
        })

        this.layer = new Konva.Layer({
          pixelRatio: 1.0,
        })
        this.layer.getCanvas().setPixelRatio(1.0)

        this.stage.add(this.layer)
        // 绑定事件
        this.stage.on('mousedown touchstart', this.handleMouseDown)
        this.stage.on('mousemove touchmove', this.handleMouseMove)
        this.stage.on('mouseup touchend', this.handleMouseUp)
        this.stage.on('click tap', this.handleCanvasClick)

        const konvaContentDiv = $containerRef.querySelector('.konvajs-content')
        console.log(`91 konvaContentDiv`, konvaContentDiv)
        if (konvaContentDiv) {
          // 然后在这个 div 里找到 canvas 标签
          const canvas = konvaContentDiv.querySelector('canvas')
          if (canvas) {
            console.log('成功找到 Canvas:', canvas)
            // canvas.width = width
            // canvas.height = height
          } else {
            console.error('在 konvajs-content 中未找到 canvas！')
          }
        } else {
          console.error('未找到 konvajs-content 容器！')
        }
        this.$mitt.emit('knova-canvas-ready', this.stage)
      }
    },

    initTextMeasureCtx() {
      const canvas = document.createElement('canvas')
      this.measureCtx = canvas.getContext('2d')
    },

    // 设置当前工具
    setTool(tool) {
      if (!this.isInteracting) return
      this.cancelText()
      this.currentTool = tool
    },

    // 更新当前颜色
    updateCurrentColor() {
      if (!this.isInteracting) return
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
      console.log(`84 this.isInteracting`, this.isInteracting)
      if (!this.isInteracting) return
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
      if (!this.isInteracting) return
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

    /**
     * 点击画布时处理文字工具
     */
    handleCanvasClick(e) {
      if (!this.isInteracting) return
      if (this.currentTool !== 'text' || this.showTextInput) return
      // 获取点击位置（相对于画布）
      const pos = this.stage.getPointerPosition()
      if (!pos) return
      // 1. 如果点击的是现有文本节点 -> 编辑
      if (e.target instanceof Konva.Text) {
        const textNode = e.target
        const textPos = textNode.position()
        // 保存要编辑的文本
        this.editingNode = textNode
        // 计算最终点击位置（用于定位输入框）
        const finalClickPos = this.calculateTextInsertPosition(textPos, textNode)
        this.openTextInput(finalClickPos.x, finalClickPos.y, textNode.text())
        return
      }
      // 2. 点击空白处 -> 新建文本
      // 直接传递点击位置，openTextInput会处理最终定位
      this.openTextInput(pos.x, pos.y)
    },

    /**
     * 计算文本插入的最终位置，使得 (x, y) 点位于文本的顶部中间
     * @param {number} x - 目标x坐标
     * @param {number} y - 目标y坐标
     * @param {string} text - 文本内容（可选，用于测量高度）
     * @returns {{x: number, y: number}} - 最终的文本位置
     */
    calculateTextInsertPosition(x, y, text = '') {
      const textNode = new Konva.Text({
        text: text,
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
      })
      const textHeight = textNode.height()
      return {
        x: x - textNode.width() / 2, // 文字中心对齐x坐标
        y: y - textHeight / 2, // 文字顶部中心对齐y坐标 (点击位置在文字顶部中间)
      }
    },

    // ================= 文字工具相关方法 =================

    /**
     * 打开文字输入框
     * @param {number} x - 目标文字中心的x画布坐标
     * @param {number} y - 目标文字顶部的y画布坐标
     * @param {string} existingText - 现有文本（编辑时传入）
     */
    openTextInput(x, y, existingText = '') {
      // 将画布坐标转换为DOM像素坐标以定位输入框
      const point = this.stage.getPointerPosition()
      const stageContainer = this.stage.container()
      const containerRect = stageContainer.getBoundingClientRect()

      // 输入框的位置是基于整个视口的，使用getBoundingClientRect获取画布左上角的视口坐标
      this.textInputPos = {
        x: containerRect.left + x,
        y: containerRect.top + y,
      }

      // 设置初始内容
      this.textContent = existingText
      // 基于文本内容预估一个初始宽度
      const estimatedWidth = existingText.length * this.textStyle.fontSize * 0.6 + 20
      this.inputWidth = Math.max(100, estimatedWidth)

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

    /**
     * 创建文本节点
     * @param {number} x - 文字节点的x坐标
     * @param {number} y - 文字节点的y坐标
     * @param {string} text - 文字内容
     */
    createTextNode(x, y, text) {
      if (!text.trim()) return // 空文本不创建

      const textNode = new Konva.Text({
        x: x,
        y: y,
        text: text,
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
        fill: this.strokeColor,
        draggable: true,
        name: 'text',
      })

      // 双击编辑
      textNode.on('dblclick', () => {
        const pos = this.calculateTextInsertPosition(textNode.x(), textNode.y(), textNode.text())
        this.editingNode = textNode
        this.openTextInput(pos.x, pos.y, textNode.text())
        // 编辑时先不删除旧节点，等确认后再删，避免闪烁
      })

      // 选中效果
      textNode.on('click tap', (e) => {
        e.cancelBubble = true // 阻止事件冒泡到画布
        this.layer.getChildren().forEach((node) => {
          node.strokeWidth(2)
          node.setAttr('isSelected', false)
        })

        textNode.stroke(this.strokeColor)
        textNode.strokeWidth(4)
        textNode.setAttr('isSelected', true)
        this.layer.batchDraw()
      })

      // 拖拽和变换保存历史
      textNode.on('transformend', () => this.saveHistory({ immediate: true }))
      textNode.on('dragend', () => this.saveHistory({ immediate: true }))

      // 取消编辑节点（如果有）
      if (this.editingNode) {
        this.editingNode.destroy()
        this.editingNode = null
      }

      this.layer.add(textNode)
      this.layer.batchDraw()
      this.saveHistory({ immediate: true })
    },
    // ================= 撤销/重做功能 =================

    /**
     * 保存当前画布状态到历史记录
     */
    // 替换您的 saveHistory
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
            x: shapeData.attrs.x,
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

    handleCanvasClick(e) {
      if (this.currentTool !== 'text') return
      // 1. 如果编辑框已经显示，别处理新点击，防止闪烁或问题
      if (this.showTextInput) return
      const stagePos = this.stage.getPointerPosition()
      if (!stagePos) return
      // 2. 如果点击的是现有文本节点 -> 编辑模式
      if (e.target instanceof Konva.Text) {
        const clickedNode = e.target
        this.editingNode = clickedNode // 保存被编辑的节点
        this.textContent = clickedNode.text() // 预填文本

        // 被编辑的旧的，我们不在点击时删除，而是在用户确认时删除
        this.openTextInputAtStagePos(stagePos.x, stagePos.y)
        return
      }
      // 3. 点击空白处 -> 新建模式
      this.editingNode = null // 确保是新建模式
      this.textContent = '' // 清空文本
      this.openTextInputAtStagePos(stagePos.x, stagePos.y)
    },

    /**
     * 在指定的画布坐标位置打开文字输入框
     * @param {number} stageX - 画布X坐标
     * @param {number} stageY - 画布Y坐标
     */
    openTextInputAtStagePos(stageX, stageY) {
      this.textInsertStageX = stageX
      this.textInsertStageY = stageY
      // 1. 创建一个虚拟的 Konva.Text 对象来测量大小
      //    这个对象的大小代表了我们将要输入的文本的大小。
      const virtualText = new Konva.Text({
        text: 'M', // 使用 'M' 作为基准，因为它通常是字体中最高的字符
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
        lineHeight: 1.2, // 关键！设置行高，让文字看起来是“居中”放置的
      })

      // 2. 计算我们期望的插入偏移
      //    因为我们设置了 lineHeight，所以文字“感觉上”是从点击位置开始的。
      //    我们需要将输入框向下移动一点点，让它看起来在文字的基线之上。
      const yOffset = this.textStyle.fontSize * 0.25 // 微调值，让视觉效果更好

      // 3. 计算虚拟文本顶部在画布中的位置
      //    虚拟文本的基线位置在 (stageX, stageY) - (0, (lineHeight - 1) * fontSize / 2)
      const textAbsPos = virtualText.getAbsolutePosition()
      virtualText.destroy() // 用完即删，不占用内存
      const containerAbsPos = this.stage.container().getBoundingClientRect()
      const containerStagePos = {
        x: containerAbsPos.left - window.pageXOffset,
        y: containerAbsPos.top - window.pageYOffset,
      }

      const textTopOnStage = {
        x: stageX,
        y: stageY - this.textStyle.fontSize * 0.2, // 向上移动虚拟文本，使其中心对齐点击
      }

      // 4. 计算输入框相对于视口的最终位置
      this.textInputPos = {
        x: containerStagePos.x + textTopOnStage.x,
        y: containerStagePos.y + textTopOnStage.y - yOffset,
      }

      // 5. 设置初始宽度并显示输入框
      this.inputWidth = 100 // 初始宽度
      this.showTextInput = true

      // 6. 在下一个 tick 中聚焦输入框
      this.$nextTick(() => {
        if (this.$refs.textInput) {
          this.$refs.textInput.focus()
          // 全选文本
          this.$refs.textInput.setSelectionRange(0, this.textContent.length)
        }
      })
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

      const textarea = this.$refs.textInput
      const testText = this.textContent || ' ' // 必须有一个字符才能测量

      // 计算文本宽度
      this.measureCtx.font = `${this.textStyle.fontSize}px ${this.textStyle.fontFamily}`
      const textWidth = this.measureCtx.measureText(testText).width

      // 限制最大宽度不超过画布边缘
      const currentStageX = this.stage.getPointerPosition().x
      const maxWidth = this.stage.width() - currentStageX - 10

      this.inputWidth = Math.min(Math.max(textWidth + 16, 100), maxWidth)

      // 动态调整高度
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
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

    confirmText() {
      const text = this.textContent.trim()
      if (!text) {
        this.cancelText()
        return
      }

      // 无论新旧，都用用户最初点击的画布坐标创建文字
      // 注意：这里的 x,y 是从 handleCanvasClick 中传进来的，没有随输入框移动而改变
      if (this.editingNode) {
        // 如果是编辑旧文字，先删除旧节点
        this.editingNode.destroy()
      }

      // 创建新文字，使用点击时记录的画布坐标
      // 注意：handleCanvasClick 中我们没有记录这个坐标！这是个bug，需要修改。
      // 我们需要在 openTextInputAtStagePos 中记录这个 stageX, stageY。
      // 所以我们需要添加两个 data: textInsertStageX, textInsertStageY

      this.createTextNode(this.textInsertStageX, this.textInsertStageY, text)

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
      if (!text.trim()) return

      const textNode = new Konva.Text({
        x: x,
        y: y,
        text: text,
        fontSize: this.textStyle.fontSize,
        fontFamily: this.textStyle.fontFamily,
        fill: this.strokeColor,
        draggable: true,
        name: 'text',
        // **关键**：这里设置了视觉行高，让所有文字都“居中”在 (x, y) 点
        lineHeight: 1.2,
      })

      // ... (事件绑定代码保持不变) ...
      textNode.on('click tap', (e) => {
        e.cancelBubble = true
        this.layer.getChildren().forEach((node) => {
          if (node !== textNode && node.getAttr('isSelected')) {
            node.strokeWidth(2)
            node.setAttr('isSelected', false)
          }
        })
        textNode.stroke(this.strokeColor)
        textNode.strokeWidth(4)
        textNode.setAttr('isSelected', true)
        this.layer.batchDraw()
      })

      textNode.on('dblclick', () => {
        const pos = this.stage.getPointerPosition()
        this.editingNode = textNode
        // 记录下编辑时的画布坐标
        this.textInsertStageX = pos.x
        this.textInsertStageY = pos.y
        this.openTextInputAtStagePos(pos.x, pos.y)
      })

      textNode.on('transformend dragend', () => {
        if (!this._loadingHistory) {
          this.saveHistory()
        }
      })

      this.layer.add(textNode)
      this.layer.batchDraw()
      this.saveHistory({ immediate: true })
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
      if (!this.isInteracting) return
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
      if (!this.isInteracting) return
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
  font-size: 12px;
  background-color: #000;
  color: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.toolbar button {
  padding: 6px 6px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar div:hover {
  background-color: #fff;
  color: #000;
}

.toolbar .active {
  background-color: #fff;
  color: #000;
}

.toolbar div:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-picker {
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 100% !important;
  height: 100% !important;
  z-index: 9999;
  background: blue;
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

.full-screen-overlay {
  position: fixed; /* 关键！相对于视口定位 */
  top: 0;
  left: 300px;
  width: calc(100% - 600px);
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  color: #333;
  z-index: 1; /* 确保它在下面 */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
