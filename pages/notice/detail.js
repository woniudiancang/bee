const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {

  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.notice.title,
    })
    this.noticeDetail(options.id)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  async noticeDetail(id) {
    const res = await WXAPI.noticeDetail(id)
    if (res.code == 0) {
      this.setData({
        noticeDetail: res.data
      })
    }
  },
})