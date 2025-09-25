<template>
  <div>
    <g-tooltip :content="item.standardId" style="width: 100px">
      {{ item.standardId }}
    </g-tooltip>

    <g-tooltip :content="item.short" style="width: 100px">
      {{ item.short }}
    </g-tooltip>
  </div>
</template>

<script>
export default {
  name: 'T1',
  components: {},
  props: {},
  data() {
    return {
      item: {
        short: '123',
        standardId:
          ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus eius quia consequatur rerum quis expedita fugit dolores ex est iure, ad sapiente maxime reiciendis optio ut. Quisquam sequi alias laboriosam.',
      },
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss"></style>
