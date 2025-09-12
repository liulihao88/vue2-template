import requestNew from '@/utils/axios.js'

export function login(user, pass) {
  return requestNew.post('apps/beitou/external/delivery/user/localAuth', {
    user: user,
    pass: pass,
  })
}
