export const tableOption = {
  border: false,
  index: true,
  indexLabel: '序号',
  stripe: true,
  labelWidth: 150,
  menuWidth: 260,
  menuAlign: 'center',
  align: 'left',
  refreshBtn: false,
  showClomnuBtn: false,
  searchMenuSpan: 6,
  searchSize: 'mini',
  columnBtn: false,
  addBtn: false,
  editBtn: false,
  viewBtn: false,
  delBtn: false,
  height: '100%',
  column: [
    {
      type: "select",
		  dicUrl: '/apps/beitou/prjfilebimauditdetail/prjListVL',
      label: '项目名称',
      prop: 'prjId',
      span: 12,
      search: true,
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: '任务ID必须填写'
        }
      ]
    },
    {
      type: 'input',
      label: '文件名',
      prop: 'fileName',
      span: 12,
      overHidden: true,
      required: true,
      rules: [
        {
          required: true,
          message: '文件名必须填写'
        }
      ]
    },
    {
      type: 'textarea',
      label: '文件描述',
      prop: 'fileDesc',
      span: 24,
      overHidden: true
    },
    {
      type: 'input',
      label: '文件路径',
      prop: 'filePath',
      span: 24,
      overHidden: true,
      disabled: true
    },
    {
      type: 'select',
      dicUrl: '/admin/constants/enum/YesNoEnum',
      label: '转换状态',
      prop: 'convertStatus',
      span: 12,
      display: false
    },
    {
      type: 'select',
      dicUrl: '/admin/constants/enum/YesNoEnum',
      label: '审查状态',
      prop: 'auditStatus',
      span: 12,
      display: false
    },
    {
      type: 'textarea',
      label: '备注',
      prop: 'remark',
      span: 24,
      overHidden: true
    }
  ]
}
