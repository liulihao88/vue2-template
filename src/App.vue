<template>
  <div id="app">
    <router-view v-if="$refresh.$refresh" />
    <!-- <div style="position: fixed; bottom: 60px; right: 20px; color: red">showRouterView: {{ showRouterView }}
    </div> -->
    <quick-refresh-button />
  </div>
</template>

<script>
export default {
  name: "App",
  data() {

  },
  methods: {}
};
</script>
