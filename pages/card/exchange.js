const WXAPI = require('apifm-wxapi')
Page({
  data: {
    agree: false,
  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.card.excharge,
    })
  },
  _agree() {
    this.setData({
      agree: !this.data.agree
    })
  },
  xieyi() {
    wx.navigateTo({
      url: '/pages/about/index?key=lipinkaxieyi',
    })
  },
  async submit(){
    if (!this.data.number) {
      wx.showToast({
        title: this.data.$t.card.pleaseInputNumber,
        icon: 'none'
      })
      return
    }
    if (!this.data.agree) {
      wx.showToast({
        title: this.data.$t.card.xieyi0,
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/twoctygmpqlhnfkm
    const res = await WXAPI.cardExchangeFromPwd({
      token: wx.getStorageSync('token'),
      number: this.data.number
    })
    wx.hideLoading()
    if (res.code == 0) {
      wx.showModal({
        content: this.data.$t.coupons.Redemption,
        showCancel: false,
        success: (res) => {
          wx.setStorageSync('cardmyrefresh', true)
          wx.navigateBack()
        }
      })
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
})