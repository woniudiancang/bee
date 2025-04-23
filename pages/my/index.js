const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {

}

Page({
  data: {
    couponStatistics: {
      canUse: 0
    },
    balance: 0.00,
    score: 0,
    nick: undefined,
  },
  onLoad() {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.my.title,
    })
    this.setData({
      myBg: wx.getStorageSync('myBg'),
      version: CONFIG.version,
      customerServiceType: CONFIG.customerServiceType
    })
    getApp().getUserDetailOK = (apiUserInfoMap) => {
      this.processGotUserDetail(apiUserInfoMap)
    }
  },
  onShow() {
    getApp().getUserApiInfo().then(apiUserInfoMap => {
      this.processGotUserDetail(apiUserInfoMap)
    })
  },
  async processGotUserDetail(apiUserInfoMap) {
    if (!apiUserInfoMap) {
      return
    }
    const order_hx_uids = wx.getStorageSync('order_hx_uids')
    const _data = {}
    _data.apiUserInfoMap = apiUserInfoMap
    _data.nick = apiUserInfoMap.base.nick
    if (order_hx_uids && order_hx_uids.indexOf(apiUserInfoMap.base.id) != -1) {
      _data.canHX = true // 具有扫码核销的权限
    }
    const admin_uids = wx.getStorageSync('admin_uids')
    if (admin_uids && admin_uids.indexOf(apiUserInfoMap.base.id) != -1) {
      _data.isAdmin = true
    }
    this.setData(_data)
    this.getUserAmount()
    this.couponStatistics()
  },
  async couponStatistics() {
    const res = await WXAPI.couponStatistics(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        couponStatistics: res.data
      })
    }
  },
  async getUserAmount() {
    const res = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        balance: res.data.balance,
        score: res.data.score
      })
    }
  },
  scanOrderCode(){
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        wx.navigateTo({
          url: '/pages/order-details/scan-result?hxNumber=' + res.result,
        })
      },
      fail(err) {
        console.error(err)
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  goCoupons() {
    wx.navigateTo({
      url: '/pages/coupons/index?tabIndex=1',
    })
  },
  goBalance() {
    wx.navigateTo({
      url: '/pages/asset/index',
    })
  },
  goScorelog() {
    wx.navigateTo({
      url: '/pages/score/logs',
    })
  },
  goadmin() {
    wx.navigateToMiniProgram({
      appId: 'wx5e5b0066c8d3f33d',
      path: 'pages/autoLogin?token=' + wx.getStorageSync('token'),
    })
  },
  clearStorage() {
    wx.clearStorageSync()
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },
  govip() {
    wx.navigateTo({
      url: '/pages/member-center/index',
    })
  },
  editNick() {
    this.setData({
      nickShow: true
    })
  },
  async _editNick() {
    if (!this.data.nick) {
      wx.showToast({
        title: this.data.$t.my.nickRequired,
        icon: 'none'
      })
      return
    }
    const postData = {
      token: wx.getStorageSync('token'),
      nick: this.data.nick,
    }
    const res = await WXAPI.modifyUserInfo(postData)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: this.data.$t.common.submitSuccess,
    })
    getApp().getUserApiInfo().then(apiUserInfoMap => {
      this.processGotUserDetail(apiUserInfoMap)
    })
  },
  async onChooseAvatar(e) {
    console.log(e);
    const avatarUrl = e.detail.avatarUrl
    let res = await WXAPI.uploadFileV2(wx.getStorageSync('token'), avatarUrl)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    res = await WXAPI.modifyUserInfo({
      token: wx.getStorageSync('token'),
      avatarUrl: res.data.url,
    })
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: this.data.$t.common.submitSuccess,
    })
    getApp().getUserApiInfo().then(apiUserInfoMap => {
      this.processGotUserDetail(apiUserInfoMap)
    })
  },
  goUserCode() {
    wx.navigateTo({
      url: '/pages/my/user-code',
    })
  },
  customerService() {
    wx.openCustomerServiceChat({
      extInfo: {url: wx.getStorageSync('customerServiceChatUrl')},
      corpId: wx.getStorageSync('customerServiceChatCorpId'),
      success: res => {},
      fail: err => {
        console.error(err)
      }
    })
  },
  copyuid() {
    wx.setClipboardData({
      data: this.data.apiUserInfoMap.base.id + ''
    })
  },
})