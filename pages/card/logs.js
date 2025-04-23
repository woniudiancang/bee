const WXAPI = require('apifm-wxapi')
Page({
  data: {
    page: 1 // 读取第几页
  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.card.logs,
    })
    this.data.cardId = options.cardId
    this.cardMyLogs()
  },
  async cardMyLogs(){
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/gp7sey
    const res = await WXAPI.cardMyLogs({
      token: wx.getStorageSync('token'),
      cardId: this.data.cardId,
      page: this.data.page
    })
    wx.hideLoading()
    if (res.code == 0) {
      if (this.data.page == 1) {
        this.setData({
          list: res.data.result,
        })
      } else {
        this.setData({
          list: this.data.list.concat(res.data.result),
        })
      }
    } else {
      if (this.data.page == 1) {
        this.setData({
          list: null,
        })
      }
    }
  },
  onPullDownRefresh: function () {
    this.data.page = 1
    this.cardMyLogs()
    wx.stopPullDownRefresh()
  },
  onReachBottom() {
    this.data.page++
    this.cardMyLogs()
  },
})