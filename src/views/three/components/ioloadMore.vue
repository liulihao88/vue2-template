<template>
  <div>
    <div ref="bottomRef" style="height: 10px"></div>
  </div>
</template>

<script>
export default {
  name: 'IoLoadMore',
  components: {},
  props: {
    sceneNodes: {
      type: Array,
    },
    pageSize: {
      type: Number,
    },
  },
  data() {
    return {
      item: [],
      io: '',
      pageNumber: 1,
    }
  },
  computed: {},
  watch: {},
  created() {
    this.io = new IntersectionObserver(this.loadMore)
  },
  mounted() {
    this.io.observe(this.$refs.bottomRef)
  },
  methods: {
    reset() {

      this.pageNumber = 1
      console.log(`1115 36行 three/components/ioloadMore.vue reset `, this.pageNumber)
    },
    loadMore(entries) {
      if (entries[0].intersectionRatio <= 0) return
      this.pageNumber = this.pageNumber + 1
      console.log(`59 this.pageNumber`, this.pageNumber)
      this.$emit('loadSuccess', this.pageNumber)
    },
  },
}
</script>
