const WXAPI = require('apifm-wxapi')
const i18n = require("../i18n/index")
const $t = i18n.$t()

async function checkSession(){
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success() {
        return resolve(true)
      },
      fail() {
        return resolve(false)
      }
    })
  })
}

async function bindSeller() {
  const token = wx.getStorageSync('token')
  const referrer = wx.getStorageSync('referrer')
  if (!token) {
    return
  }
  if (!referrer) {
    return
  }
  const res = await WXAPI.bindSeller({
    token,
    uid: referrer
  })
}

// 检测登录状态，返回 true / false
async function checkHasLogined() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  const loggined = await checkSession()
  if (!loggined) {
    wx.removeStorageSync('token')
    return false
  }
  const checkTokenRes = await WXAPI.checkToken(token)
  if (checkTokenRes.code != 0) {
    wx.removeStorageSync('token')
    return false
  }
  return true
}

async function wxaCode(){
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code)
      },
      fail() {
        wx.showToast({
          title: $t.common.getCodeError,
          icon: 'none'
        })
        return resolve($t.common.getCodeError)
      }
    })
  })
}

async function login(page){
  const _this = this
  wx.login({
    success: function (res) {
      const componentAppid = wx.getStorageSync('componentAppid')
      if (componentAppid) {
        WXAPI.wxappServiceLogin({
          componentAppid,
          appid: wx.getStorageSync('appid'),
          code: res.code
        }).then(function (res) {        
          if (res.code == 10000) {
            // 去注册
            return;
          }
          if (res.code != 0) {
            // 登录错误
            wx.showModal({
              confirmText: $t.common.confirm,
              cancelText: $t.common.cancel,
              title: $t.common.loginFail,
              content: res.msg,
              showCancel: false
            })
            return;
          }
          wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('uid', res.data.uid)
          _this.bindSeller()
          if ( page ) {
            page.onShow()
          }
        })
      } else {
        WXAPI.login_wx(res.code).then(function (res) {        
          if (res.code == 10000) {
            // 去注册
            return;
          }
          if (res.code != 0) {
            // 登录错误
            wx.showModal({
              confirmText: $t.common.confirm,
              cancelText: $t.common.cancel,
              title: $t.common.loginFail,
              content: res.msg,
              showCancel: false
            })
            return;
          }
          wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('uid', res.data.uid)
          _this.bindSeller()
          if ( page ) {
            page.onShow()
          }
        })
      }
    }
  })
}

async function authorize() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: function (res) {
        const code = res.code
        let referrer = '' // 推荐人
        let referrer_storge = wx.getStorageSync('referrer');
        if (referrer_storge) {
          referrer = referrer_storge;
        }
        // 下面开始调用注册接口
        const componentAppid = wx.getStorageSync('componentAppid')
        if (componentAppid) {
          WXAPI.wxappServiceAuthorize({
            code: code,
            referrer: referrer
          }).then(function (res) {
            if (res.code == 0) {
              wx.setStorageSync('token', res.data.token)
              wx.setStorageSync('uid', res.data.uid)
              resolve(res)
            } else {
              wx.showToast({
                title: res.msg,
                icon: 'none'
              })
              reject(res.msg)
            }
          })
        } else {
          WXAPI.authorize({
            code: code,
            referrer: referrer
          }).then(function (res) {
            if (res.code == 0) {
              wx.setStorageSync('token', res.data.token)
              wx.setStorageSync('uid', res.data.uid)
              resolve(res)
            } else {
              wx.showToast({
                title: res.msg,
                icon: 'none'
              })
              reject(res.msg)
            }
          })
        }
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

function loginOut(){
  wx.removeStorageSync('token')
  wx.removeStorageSync('uid')
}

async function checkAndAuthorize (scope) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (!res.authSetting[scope]) {
          wx.authorize({
            scope: scope,
            success() {
              resolve() // 无返回参数
            },
            fail(e){
              console.error(e)
              // if (e.errMsg.indexof('auth deny') != -1) {
              //   wx.showToast({
              //     title: e.errMsg,
              //     icon: 'none'
              //   })
              // }
              wx.showModal({
                content: $t.common.authorizeRequired,
                showCancel: false,
                confirmText: $t.common.authorize,
                confirmColor: '#e64340',
                success(res) {
                  wx.openSetting();
                },
                fail(e){
                  console.error(e)
                  reject(e)
                },
              })
            }
          })
        } else {
          resolve() // 无返回参数
        }
      },
      fail(e){
        console.error(e)
        reject(e)
      }
    })
  })  
}

module.exports = {
  checkHasLogined: checkHasLogined,
  wxaCode: wxaCode,
  login: login,
  loginOut: loginOut,
  checkAndAuthorize: checkAndAuthorize,
  authorize: authorize,
  bindSeller: bindSeller
}
