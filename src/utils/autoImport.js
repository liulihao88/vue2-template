import Vue from "vue";

// 自动注册全局组件
const requireComponent = require.context(
  "@/components", // 组件目录路径
  true, // 是否遍历子目录
  /\.vue$/ // 匹配文件的正则
);

console.log(`64 requireComponent`, requireComponent);
requireComponent.keys().forEach((fileName) => {
  const componentConfig = requireComponent(fileName);
  // 获取组件名（去除文件名开头的 `./` 和扩展名）
  const componentName = fileName
    .replace(/^\.\//, "")
    .replace(/\.\w+$/, "")
    // 可选：转换驼峰命名（如 `MyComponent.vue` -> `my-component`）
    .replace(/\//g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();

  // 全局注册组件
  console.log(`59 componentName`, componentName);
  Vue.component(componentName, componentConfig.default || componentConfig);
});
