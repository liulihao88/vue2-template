import { handleBeforeUploadImage } from "@/util";

export const tableOption = {
  border: true, // 启用边框便于调试
  menu: false, // 核心开关
  editBtn: false,
  delBtn: false, // 必须彻底关闭
  addBtn: false,
  refreshBtn: false,
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
      span: 12,
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
      type: "textarea",
      label: "审查详情",
      prop: "auditContent",
      span: 24,
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: "审查详情必须填写"
        }
      ]
    },
    {
      type: "upload",
      method: "post",
      action: "/admin/sys-file/upload?bucketName=prjfilebimauditdetail",
      listType: "picture-img",
      uploadBefore: handleBeforeUploadImage,
      tip: "只能上传jpg/png/gif文件",
      limit: 1,
      propsHttp: {
        res: "data"
      },
      label: "审查截图",
      prop: "auditPics",
      hide: true,
      span: 24,
      required: true,
      rules: [
        {
          required: true,
          message: "审查截图必须填写"
        }
      ]
    },
    {
      label: "操作",
      width: 60,
      prop: "operation",
      align: "center",
      useSlot: true
    }
  ]
};
