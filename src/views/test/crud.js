import { handleBeforeUploadImage } from "@/util";

export const tableOption = {
  // 全局配置（精简关键参数）
  border: true, // 启用边框便于调试
  menu: false, // 核心开关
  editBtn: false,
  delBtn: false, // 必须彻底关闭
  addBtn: false,
  highlightCurrentRow: false,
  viewBtn: false,
  height: "calc(100vh - 200px)", // 明确高度
  menuWidth: 80,
  column: [
    {
      type: "select",
      dicUrl: "/apps/beitou/prjfilebimstandard/listVL",
      label: "标准名称",
      prop: "standardId",
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: "标准名称必须填写"
        }
      ]
    },
    {
      type: "select",
      dicUrl: "/apps/beitou/prjfilebimstandard/listVL",
      label: "标准名称",
      prop: "standardId",
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: "标准名称必须填写"
        }
      ]
    },
    {
      label: '操作',
      width: 60,
      prop: 'operation',
      align: 'center',
      useSlot: true
    }
  ]
};
