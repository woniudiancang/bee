const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {

  },
  onLoad (e) {
    this.data.key = e.key || 'about'
    this.cmsPage()
  },
  async cmsPage() {
    const res = await WXAPI.cmsPage(this.data.key)
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