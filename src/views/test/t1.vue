<template>
  <div>
    <div class="myfont icon-clipboard"></div>
    <div v-for="(v, i) in item" :key="i">
      <div>{{ v }}</div>
    </div>
    <div ref="bottomRef" style="height: 10px"></div>
  </div>
</template>

<script>
export default {
  name: 'T1',
  components: {},
  props: {},
  data() {
    return {
      item: [],
      io: '',
      num: 60,
      page: 1,
    }
  },
  computed: {},
  watch: {},
  created() {
    this.init()
    this.io = new IntersectionObserver(this.loadMore)
  },
  mounted() {
    this.io.observe(this.$refs.bottomRef)
  },
  methods: {
    init() {
      for (let i = this.num * this.page - 60; i < this.num * this.page; i++) {
        this.item.push(i)
      }
      this.page++
    },
    loadMore(entries) {
      console.log(`97 entries`, entries)
      console.log(`97 entries[0]`, entries[0])
      if (entries[0].intersectionRatio <= 0) return
      this.init()
    },
  },
}
</script>
