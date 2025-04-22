const WXAPI = require('apifm-wxapi')
Page({
  data: {

  },
  onLoad(e) {
    getApp().initLanguage(this)
    this.banners()
  },
  onShow() {
    this.getUserApiInfo()
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync('token'))
    if (res.code == 0) {
      const _data = {}
      _data.apiUserInfoMap = res.data
      _data.nick = res.data.base.nick
      if (this.data.order_hx_uids && this.data.order_hx_uids.indexOf(res.data.base.id) != -1) {
        _data.canHX = true // 具有扫码核销的权限
      }
      const admin_uids = wx.getStorageSync('admin_uids')
      if (admin_uids && admin_uids.indexOf(res.data.base.id) != -1) {
        _data.isAdmin = true
      }
      this.setData(_data)
    }
  },
  async banners() {
    // https://www.yuque.com/apifm/nu0f75/ms21ki
    const res = await WXAPI.banners({
      type: 'shouye'
    })
    if (res.code == 0) {
      this.setData({
        banners: res.data
      })
    }
  },
  tapBanner(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  onShareAppMessage() {
    return {
      title: wx.getStorageSync('mallName') + ' ' + wx.getStorageSync('share_profile'),
      path: '/pages/home/index?inviter_id=' + (wx.getStorageSync('uid') || ''),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  onShareTimeline() {
    return {
      title: wx.getStorageSync('mallName') + ' ' + wx.getStorageSync('share_profile'),
      query: 'inviter_id=' + (wx.getStorageSync('uid') || ''),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  changeLang() {
    getApp().changeLang(this)
  },
  huiyuan() {
    wx.navigateTo({
      url: '/pages/member-center/index',
    })
  },
  coupon() {
    wx.navigateTo({
      url: '/pages/coupons/index',
    })
  },
  changePeisongType(e) {
    const peisongType = e.currentTarget.dataset.type
    wx.setStorageSync('peisongType', peisongType)
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  about() {
    wx.navigateTo({
      url: '/pages/about/index',
    })
  },
  about() {
    wx.navigateTo({
      url: '/pages/about/index',
    })
  },
  touming() {
    wx.navigateTo({
      url: '/pages/about/index?key=toumingshicai',
    })
  },
})