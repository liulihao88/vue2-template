<template>
  <div>
    <div class="bim-annotation">
      <div class="bim-bar--status bim-bar bim-toolbar bim-anno-color--red bim-anno-size--small">
        <!-- <div btn-tag="cloudFrame" class="anno-btn bim-button bim-button myfont iconprev" title="云线框"></div> -->
        <svg-icon iconClass="iconprev" class="anno-btn bim-button bim-button myfont iconjiantou"></svg-icon>
        <svg-icon iconClass="iconnext" class="anno-btn bim-button bim-button myfont iconjiantou"></svg-icon>
        <svg-icon iconClass="delete" class="anno-btn bim-button bim-button myfont iconjiantou"></svg-icon>
        <div
          btn-tag="arrow"
          class="anno-btn bim-button bim-button myfont iconjiantou bim-button-active"
          title="箭头"></div>
        <div btn-tag="cloudFrame" class="anno-btn bim-button bim-button myfont iconyunxiankuang" title="云线框"></div>
        <div btn-tag="cloud" class="anno-btn bim-button bim-button myfont iconyunxian" title="云线"></div>
        <div btn-tag="line" class="anno-btn bim-button bim-button myfont iconzhexian" title="折线"></div>
        <div btn-tag="rect" class="anno-btn bim-button bim-button myfont iconjuxingkuang" title="矩形"></div>
        <div btn-tag="cycle" class="anno-btn bim-button bim-button myfont iconyuan" title="椭圆"></div>
        <div btn-tag="x" class="anno-btn bim-button bim-button myfont iconXxian" title="X"></div>
        <div btn-tag="text" class="anno-btn bim-button bim-button myfont iconwenzi" title="文字"></div>
        <div
          btn-tag="color"
          class="bim-button bim-anno-checked-btn bim-anno-btn-color bim-toolbar-button-sub"
          title="颜色">
          <div class="bim-color-cycle bim-color-btn--main"></div>
          <div class="bim-toolbar-sub" title="颜色">
            <div btn-tag="red" class="color-btn bim-button" title="红">
              <div class="bim-color-cycle bim-anno-color--red"></div>
            </div>
            <div btn-tag="yellow" class="color-btn bim-button bim-button" title="黄">
              <div class="bim-color-cycle bim-anno-color--yellow"></div>
            </div>
            <div btn-tag="blue" class="color-btn bim-button bim-button" title="蓝">
              <div class="bim-color-cycle bim-anno-color--blue"></div>
            </div>
            <div btn-tag="green" class="color-btn bim-button bim-button" title="绿">
              <div class="bim-color-cycle bim-anno-color--green"></div>
            </div>
          </div>
        </div>
        <div btn-tag="size" class="bim-button bim-anno-checked-btn bim-toolbar-button-sub" title="粗细">
          <div class="bim-size-line bim-size-btn--main"></div>
          <div class="bim-toolbar-sub" title="粗细">
            <div btn-tag="small" class="font-btn bim-button" title="细">
              <div class="bim-size-line bim-anno-size--small"></div>
            </div>
            <div btn-tag="normal" class="font-btn bim-button bim-button" title="中">
              <div class="bim-size-line bim-anno-size--normal"></div>
            </div>
            <div btn-tag="big" class="font-btn bim-button bim-button" title="粗">
              <div class="bim-size-line bim-anno-size--big"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="bim-annotation--save">
        <input class="txtInput" placeholder="请输入批注描述" maxlength="30" />
        <div btn-tag="cancel" class="bim-button--plain annotation-button" title="取消">取消</div>
        <div btn-tag="save" class="bim-button--frame annotation-button" title="保存">保存</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'T3',
  components: {},
  props: {},
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {},
}
</script>
<style scoped lang="scss"></style>
