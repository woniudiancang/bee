const APP = getApp()
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.scoreLogs.title,
    })
    this.scoreLogs()
  },
  onShow: function () {

  },
  async scoreLogs() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.scoreLogs({
      token: wx.getStorageSync('token'),
      page:1,
      pageSize:500
    })
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        scoreLogs: res.data.result
      })
    }
  },
})