const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {

  },
  onLoad: function (options) {
    this.cmsPage()
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
  async cmsPage() {
    const res = await WXAPI.cmsPage('about')
    if (res.code == 0) {
      this.setData({
        cmsPage: res.data
      })
    }
  },
})