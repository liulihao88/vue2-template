<template>
  <div>
    <div
      :data-node-id="node.uuid"
      class="node-item-container"
      :class="{
        'node-active': isSelected,
        'node-mesh': node.isMesh,
        'node-group': !node.isMesh,
        'is-top-level': displayName === 'root',
      }"
      @click.stop="handleClick">
      <span v-if="hasChildren" class="expand-toggle" @click.stop="toggleExpand">
        {{ expanded ? '−' : '+' }}
      </span>
      <span class="node-name">
        {{ displayName }}
      </span>
    </div>

    <div
      v-show="expanded"
      v-if="hasChildren"
      class="children-container"
      :class="{ 'not-expanded': !expanded, 'is-top-level': displayName === 'root' }"
      ref="notExpandedRef">
      <node-item
        v-for="child in node.children"
        :key="child.uuid"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        @node-select="$emit('node-select', $event)" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'NodeItem',
  props: {
    node: {
      type: Object,
      required: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
    selectedId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      expanded: this.depth < 2, // Auto-expand first few levels by default
    }
  },
  computed: {
    hasChildren() {
      return this.node.children && this.node.children.length > 0
    },
    isSelected() {
      return this.selectedId === this.node.uuid
    },
    displayName() {
      if (this.node.name) return this.node.name
      if (this.node.isMesh) return `${this.node.type}_${this.node.uuid.slice(0, 4)}`
      return `${this.node.type}_${this.node.uuid.slice(0, 4)}`
    },
  },
  methods: {
    handleClick() {
      this.$emit('node-select', this.node)
    },
    toggleExpand() {
      this.expanded = !this.expanded
    },
  },
}
</script>

<style scoped>
.node-item-container {
  padding: 4px 8px;
  margin-left: calc(v-bind(depth) * 12px);
  margin-bottom: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;
  border: 1px solid transparent; /* 默认无边框 */
}
.node-item-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
/* 移除顶级节点的特殊颜色和边框 */
.node-item-container.is-top-level {
  border: none;
  /*如果你想连颜色也去掉：*/
  color: inherit;
  display: none;
}
.node-active {
  background-color: rgba(0, 255, 0, 0.2) !important;
  font-weight: bold;
}
.node-mesh {
  color: #4fc3f7;
}
.node-group {
  color: #f06292;
}
/* 确保 node-mesh/node-group 类不影响顶级节点 */
.node-item-container.is-top-level.node-mesh,
.node-item-container.is-top-level.node-group {
  color: inherit;
  display: none;
}
.expand-toggle {
  display: inline-block;
  width: 16px;
  text-align: center;
  margin-right: 4px;
  font-weight: bold;
}
.node-name {
  white-space: nowrap;
  overflow: hidden;
  text-override: ellipsis;
}
.children-container {
  border-left: 1px dashed rgba(255, 255, 255, 0.1);
  margin-left: 8px;
  padding-left: 8px;
}
/* 为顶级节点的 children-container 移除左边框和左边距 */
.children-container.is-top-level {
  border-left: none;
  margin-left: 0;
  padding-left: 0;
}
/* 原有的 active 样式保持不变 */
.node-active::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #00ff00;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 255, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
  }
}
</style>
