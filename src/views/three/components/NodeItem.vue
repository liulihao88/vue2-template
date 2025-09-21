<template>
  <div>
    <div
      :data-node-id="node.uuid"
      class="node-item-container"
      :class="{
        'node-active': isSelected,
        'node-mesh': node.isMesh,
        'node-group': !node.isMesh,
      }"
      @click.stop="handleClick">
      <span v-if="hasChildren" class="expand-toggle" @click.stop="toggleExpand">
        {{ expanded ? '−' : '+' }}
      </span>
      <span class="node-name">
        {{ displayName }}
      </span>
    </div>

    <div v-show="expanded" v-if="hasChildren" class="children-container" :class="{ 'not-expanded': !expanded }" ref="notExpandedRef">
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
}

.node-item-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
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
  text-overflow: ellipsis;
}

.children-container {
  border-left: 1px dashed rgba(255, 255, 255, 0.1);
  margin-left: 8px;
  padding-left: 8px;
}

.node-active {
  background-color: rgba(0, 255, 0, 0.2) !important;
  font-weight: bold;
  position: relative;
  background-color: rgba(255, 255, 255, 0.1);
}
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
