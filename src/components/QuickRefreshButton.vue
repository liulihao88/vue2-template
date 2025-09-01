<template>
  <button @click="handleRefresh" class="refresh-btn" :style="buttonStyle">
    {{ buttonText }}
  </button>
</template>

<script>
export default {
  props: {
    position: {
      type: Object,
      default: () => ({ bottom: '20px', right: '20px' }),
    },
    buttonText: {
      type: String,
      default: '快速刷新',
    },
  },
  computed: {
    buttonStyle() {
      return {
        position: 'fixed',
        bottom: this.position.bottom,
        right: this.position.right,
        padding: '8px 16px',
        backgroundColor: '#42b983',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        zIndex: '9999',
      }
    },
  },
  methods: {
    handleRefresh() {
      // 确保能够访问到根实例
      if (this.$root && this.$root.$quickRefresh) {
        this.$root.$quickRefresh()
      } else if (this.$parent && this.$parent.$quickRefresh) {
        this.$parent.$quickRefresh()
      } else {
        console.error('QuickRefresh method not found')
      }
    },
  },
}
</script>
