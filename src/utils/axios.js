import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

// create an axios instance
const service = axios.create({
  baseURL: '/', // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 60000, // request timeout
})
const fpPromise = FingerprintJS.load()

// request interceptor
service.interceptors.request.use(
  async (config) => {
    // do something before request is sent
    const fp = await fpPromise
    const result = await fp.get()
    const visitorId = result.visitorId
    config.headers['visitorId'] = visitorId

    if (store.getters.token) {
      config.headers['X-Token'] = getToken()
    }
    const TENANT_ID = window.sessionStorage.getItem('tenantId') || process.env.VUE_APP_TENANTID
    console.log(`14 TENANT_ID`, TENANT_ID)
    if (TENANT_ID) {
      config.headers['tenantId'] = TENANT_ID === 'undefined' ? 0 : TENANT_ID // 租户ID
    }
    const appId = window.sessionStorage.getItem('appId') || process.env.VUE_APP_APPID
    console.log(`37 appId`, appId)
    if (appId) {
      config.headers['appId'] = appId // appId
    }
    return config
  },
  (error) => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  },
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  (response) => {
    const res = response.data

    // if the custom code is not 20000, it is judged as an error.
    if (res.code !== 20000) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000,
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        MessageBox.confirm(
          'You have been logged out, you can cancel to stay on this page, or log in again',
          'Confirm logout',
          {
            confirmButtonText: 'Re-Login',
            cancelButtonText: 'Cancel',
            type: 'warning',
          },
        ).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  (error) => {
    console.log('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  },
)

export default service
