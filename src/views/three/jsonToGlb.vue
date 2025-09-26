<template>
  <div>
    <div>t3</div>
    <h1>JSON to GLB Converter</h1>
    <input type="file" id="jsonFileInput" accept=".json" />
    <button @click="convertAndExport()">JSON Convert to GLB</button>
  </div>
</template>

<script>
import { convertAndExport } from './convert.js'
export default {
  name: 'T3',
  components: {},
  props: {},
  data() {
    return {
      convertAndExport: convertAndExport,
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
