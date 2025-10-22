/*
 *    Copyright (c) 2018-2025, panda All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * Neither the name of the pig4cloud.com developer nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 * Author: panda
 */

import request from '@/router/axios'

export function fetchList(query) {
  return request({
    url: '/apps/beitou/prjfilebim/page',
    method: 'get',
    params: query
  })
}

export function addObj(obj) {
  return request({
    url: '/apps/beitou/prjfilebim',
    method: 'post',
    data: obj
  })
}

export function getObj(id) {
  return request({
    url: '/apps/beitou/prjfilebim/' + id,
    method: 'get'
  })
}

export function delObj(id) {
  return request({
    url: '/apps/beitou/prjfilebim/' + id,
    method: 'delete'
  })
}

export function putObj(obj) {
  return request({
    url: '/apps/beitou/prjfilebim',
    method: 'put',
    data: obj
  })
}

export function convert(id, status) {
  return request({
    url: `/apps/beitou/prjfilebim/convert/${id}/${status}`,
    method: 'put'
  })
}

export function apply(id, status) {
  return request({
    url: `/apps/beitou/prjfilebim/audit/${id}/${status}`,
    method: 'put'
  })
}

// 转换
export function exchange(id) {
  return request({
    url: `/apps/beitou/prjfilebim/exchangeById/${id}`,
    method: 'post'
  })
}

// 获取详情
export function getAuditInfo(id) {
  return request({
    url: `/apps/beitou/prjfilebim/getAuditInfo/${id}`
  })
}

// 审查
export function auditBimInfo(id, data) {
  return request({
    url: `/apps/beitou/prjfilebim/auditBimInfo/${id}`,
    data,
    method: 'post'
  })
}

/**
 * llh新做BIM项目
 */
// 预览审查时获取单个信息 + json + 关联信息
export function getOneById(id) {
  return request({
    url: `/apps/beitou/prjfilebim/getOneById/${id}`,
    method: 'get'
  })
}

// /apps/beitou/prjfilebimauditdetail/page?current=1&size=10&bimId=xxbim文件的ID  GET  获取BIM文件审查信息，带分页
export function getPrjfilebimauditdetail(params) {
  return request({
    url: `/apps/beitou/prjfilebimauditdetail/page`,
    method: 'get',
    params
  })
}
/**
 * {
	"id": "",  //只有修改审查的时候才需要
	"bimId": "",
	"standardId",
	"auditContent": "",
	"auditPics": ""
}
 *  */
// {
//     "creator": "4",
//     "fileName": "BTDS_F4-F10_CD_A-20220505.rvt",
//     "standardName": "检查模型几何尺寸准确性",
//     "standardId": "fbad4c6fd21540de8b3833477eb8db1d",
//     "updateTime": "2025-08-14 16:48:16",
//     "prjName": "北京城市副中心行政办公区道路网2017配套道路",
//     "updater": "4",
//     "auditContent": "fff",
//     "createTime": "2025-08-12 14:56:21",
//     "bimId": "abe9f8ad366c11edbd96f46b8c5c9508",
//     "auditPics": "/admin/sys-file/prjfilebimauditdetail/aab35ae6ba034d62b950fe68868ac528.png",
//     "tenantId": 5,
//     "auditStatus": "1",
//     "id": "a27ef1cde2a240f9b971bdf997ed8676",
//     "status": "0",
//     "$index": 1,
//     "$bimId": "BTDS_F4-F10_CD_A-20220505.rvt",
//     "$standardId": "几何精度审查->检查模型几何尺寸准确性",
//     "$auditStatus": "是"
// }
// /apps/beitou/prjfilebimauditdetail  POST  提交审查
export function postPrjfilebimauditdetail(data) {
  return request({
    url: `/apps/beitou/prjfilebimauditdetail`,
    method: 'post',
    data
  })
}
// /apps/beitou/prjfilebimauditdetail  PUT    修改审查
export function putPrjfilebimauditdetail(data) {
  console.log(`19 data`, data)
  let sendParams = {
    url: `/apps/beitou/prjfilebimauditdetail`,
    method: 'put',
    data
  }
  console.log(`72 sendParams`, sendParams);
  return request(sendParams)
}
// /apps/beitou/prjfilebimauditdetail  DELETE    删除审查

export function deletePrjfilebimauditdetail(id) {
  return request({
    url: `/apps/beitou/prjfilebimauditdetail/${id}`,
    method: 'delete'
  })
}

export function getStandardOptions(){
  return request({
    url: '/apps/beitou/prjfilebimstandard/listVL'
  })
}
