<template>
  <div>
    <div>t4</div>
    <div v-for="(value, key) of obj" :key="i">
      <div>{{ key }}::{{ value }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'T4',
  components: {},
  props: {},
  data() {
    return {
      obj: {
        name: 'andy',
        age: 19,
        height: 180,
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
