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
  async cmsPage() {
    const res = await WXAPI.cmsPage('about')
    if (res.code == 0) {
      this.setData({
        cmsPage: res.data
      })
      wx.setNavigationBarTitle({
        title: res.data.info.title,
      })
    }
  },
})