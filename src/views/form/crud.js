import { handleBeforeUploadImage } from "@/util";

export const tableOption = {
  search: false, // 隐藏整个搜索栏
  searchShow: false, // 隐藏搜索按钮（单独配置）
  searchReset: false, // 隐藏清空按钮（单独配置）
  border: false,
  index: true,
  indexLabel: "序号",
  stripe: true,
  labelWidth: 150,
  menuWidth: 260,
  menuAlign: "center",
  align: "left",
  refreshBtn: false,
  showClomnuBtn: false,
  searchMenuSpan: 6,
  searchSize: "mini",
  columnBtn: false,
  addBtn: true,
  editBtn: true,
  viewBtn: true,
  delBtn: true,
  height: "100%",
  column: [
    {
      type: "select",
      dicUrl: "/apps/beitou/prjfilebim/listVL",
      label: "文件名称",
      prop: "bimId",
      span: 12,
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: "文件名称必须填写"
        }
      ]
    },
    {
      type: "select",
      dicUrl: "/apps/beitou/prjfilebimstandard/listVL",
      label: "标准名称",
      prop: "standardId",
      span: 12,
      search: true,
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
      type: "select",
      dicUrl: "/admin/constants/enum/YesNoEnum",
      label: "审查状态",
      prop: "auditStatus",
      span: 12,
      display: false
    },
    {
      type: "textarea",
      label: "备注",
      prop: "remark",
      span: 24,
      hide: true
    }
  ]
};
