<template>
  <div>
    <ElementAttribute :attribute="obj"></ElementAttribute>
  </div>
</template>

<script>
import ElementAttribute from '@/views/three/elementAttribute.vue'
export default {
  name: 'T3',
  components: {
    ElementAttribute,
  },
  props: {},
  data() {
    return {
      obj: {
        name: 'name111',
        id: 'id2222222',
        homeBorder: true,
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
