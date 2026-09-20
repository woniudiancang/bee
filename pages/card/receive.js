const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
  data: {
  },
  onLoad (e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.card.shareplaceholder,
    })
    this.setData({
      id: e.id,
      shareToken: e.shareToken
    })
    this.cardShareFetch(true)
  },
  submit() {
    this.cardShareFetch(false)
  },
  async cardShareFetch(calculate) {
    const isLogined = await AUTH.checkHasLogined()
    if (!isLogined) {
      AUTH.login(this)
      return
    }
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/gmfdsdag0gxv8tp0
    const res = await WXAPI.cardShareFetch({
      token: wx.getStorageSync('token'),
      id: this.data.id,
      shareToken: this.data.shareToken,
      calculate
    })
    wx.hideLoading()
    if (res.code == 0) {
      if (calculate) {
        this.setData({
          user: res.data.user,
          cardUser: res.data.cardUser,
          cardInfo: res.data.cardInfo,
        })
      } else {
        wx.showModal({
          content: this.data.$t.card.fetchSuccess,
          showCancel: false,
          confirmText: this.data.$t.common.gotIt,
          success: (res) => {
            wx.reLaunch({
              url: '/pages/home/index',
            })
          }
        })
      }
    } else {
      wx.showModal({
        content: this.data.$t.card.receiveEmpty,
        showCancel: false,
        confirmText: this.data.$t.common.gotIt,
        success: (res) => {
          wx.reLaunch({
            url: '/pages/home/index',
          })
        }
      })
    }
  },
})