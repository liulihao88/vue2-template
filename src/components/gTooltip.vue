<template>
  <el-tooltip class="tooltip-box" :disabled="handleDisabled" :effect="effect" v-bind="{ ...$attrs, ...tooltipAttrs }">
    <span
      @click="contentClick"
      v-if="showSlot"
      class="tooltip-box__text"
      :style="{ maxWidth: processWidth(width, true) }"
      @mouseover="onMouseOver">
      <span ref="contentRef" class="tooltip-box__content">
        <slot>{{ $attrs.content }}</slot>
      </span>
    </span>
    <!-- <slot name="content"></slot> -->
  </el-tooltip>
</template>

<script>
export default {
  name: 'gTooltip',
  props: {
    width: {
      type: String,
      default: '100%',
    },
    showSlot: {
      type: Boolean,
      default: true,
    },
    effect: {
      type: String,
      default: 'dark',
    },
    tooltipAttrs: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      // 将 isDisabled 放在这里，作为组件实例的响应式数据
      isDisabled: false,
    }
  },

  computed: {
    // 将 handleDisabled 计算属性保留在这里
    handleDisabled() {
      const attrs = this.$attrs
      if (attrs.disabled) {
        return attrs.disabled
      }
      if (!attrs.content) {
        return true
      }
      return this.isDisabled
    },
  },

  methods: {
    processWidth(initValue, isBase = false) {
      let value = initValue
      let res = ''
      if (!value) {
        return isBase ? value : {}
      } else if (typeof value === 'number') {
        value = String(value)
      }
      if (value === '') {
        return isBase ? value : {}
      } else if (typeof value === 'string' && !isNaN(value)) {
        res = value + 'px'
      } else if (typeof value === 'string' && /^[0-9]+(\.[0-9]+)?(px|%|em|rem|vw|vh|ch)*$/.test(value)) {
        res = value
      } else {
        console.warn(`${value} is Invalid unit provided`)
        return value
      }
      if (isBase) {
        return res
      }
      return { width: res }
    },
    // 将所有方法从 setup 移动到这里
    onMouseOver() {
      if (!this.showSlot) {
        return
      }
      // 通过 this.$refs 来访问模板中 ref="contentRef" 的元素
      const tag = this.$refs.contentRef
      console.log(`39 tag`, tag)
      if (!tag) return

      // 在 methods 中，可以通过 this 直接访问 props 和 data
      const parentWidth = tag.parentNode.offsetWidth
      console.log(`86 parentWidth`, parentWidth)
      const contentWidth = tag.offsetWidth
      console.log(`44 contentWidth`, contentWidth)

      // 更新 data 中的 isDisabled
      this.isDisabled = contentWidth <= parentWidth
    },

    contentClick() {
      // 通过 this.$emit 触发自定义事件
      this.$emit('click')
    },
  },
}
</script>

<style lang="scss" scoped>
.tooltip-box__text {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.tooltip-box__content {
  // height: inherit;
}
</style>
