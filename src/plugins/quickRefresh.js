// src/plugins/quickRefresh.js
import QuickRefreshButton from "@/components/QuickRefreshButton";
import { EventBus } from "@/utils/event-bus";

const QuickRefreshPlugin = {
  install(Vue, options = {}) {
    // 创建一个响应式对象
    const sharedState = Vue.observable({
      showRouterView: true
    });
    Vue.prototype.showRouterView = sharedState;
    // 通过事件总线触发刷新
    Vue.prototype.$quickRefresh = function () {
      sharedState.showRouterView = false;
      setTimeout(() => {
        sharedState.showRouterView = true;
      }, 0);
    };

    // 监听全局刷新事件
    EventBus.$on("quick-refresh", () => {
      const app = document.getElementById("app");
      if (app && app.__vue__) {
        app.__vue__.$quickRefresh();
      }
    });

    // 注册键盘快捷键
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        EventBus.$emit("quick-refresh");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 注册按钮组件
    Vue.component("quick-refresh-button", {
      ...QuickRefreshButton,
      props: {
        position: {
          type: Object,
          default: () => options.position || { bottom: "20px", right: "20px" }
        },
        buttonText: {
          type: String,
          default: options.buttonText || "快速刷新"
        }
      },
      methods: {
        handleRefresh() {
          EventBus.$emit("quick-refresh");
        }
      }
    });
  }
};

export default QuickRefreshPlugin;
