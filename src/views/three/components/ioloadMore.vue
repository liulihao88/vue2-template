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
      parseNodes: [],
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
    loadMore(entries) {
      console.log(`12 entries`, entries)
      if (entries[0].intersectionRatio <= 0) return
      this.pageNumber++
      this.$emit('loadSuccess', this.pageNumber)
    },
  },
}
</script>
