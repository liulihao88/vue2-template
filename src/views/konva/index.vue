<template>
  <div>
    <div ref="container"></div>
  </div>
</template>

<script>
import Konva from 'konva'

export default {
  mounted() {
    // 创建舞台
    const stage = new Konva.Stage({
      container: this.$refs.container, // 绑定 DOM 容器
      width: 800,
      height: 600,
    })

    // 创建图层
    const layer = new Konva.Layer()
    stage.add(layer)

    // 画圆形
    const circle = new Konva.Circle({
      x: 100,
      y: 100,
      radius: 50,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 2,
    })
    layer.add(circle)

    // 画箭头
    const arrow = new Konva.Arrow({
      points: [50, 50, 200, 200],
      pointerLength: 10,
      pointerWidth: 10,
      fill: 'blue',
      stroke: 'blue',
      strokeWidth: 5,
    })
    layer.add(arrow)

    // 更新渲染
    layer.draw()
  },
}
</script>
