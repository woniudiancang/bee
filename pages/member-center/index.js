const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {
  
}

Page({
  data: {
    totleConsumed: 0
  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.vip.title,
    })
    this.userLevelList()
    getApp().getUserApiInfo().then(apiUserInfoMap => {
      this.processGotUserDetail(apiUserInfoMap)
    })
    getApp().getUserDetailOK = (apiUserInfoMap) => {
      this.processGotUserDetail(apiUserInfoMap)
    }
  },
  onShow: function () {
  },
  async processGotUserDetail(apiUserInfoMap) {
    if (!apiUserInfoMap) {
      return
    }
    this.setData({
      apiUserInfoMap
    })
    this.userAmount()
  },
  async userAmount() {
    // https://www.yuque.com/apifm/nu0f75/wrqkcb
    const res = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        totleConsumed: res.data.totleConsumed
      });
    }
  },
  async userLevelList() {
    // https://www.yuque.com/apifm/nu0f75/fsh4gu
    const res = await WXAPI.userLevelList()
    if (res.code == 0) {
      this.setData({
        levelList: res.data.result
      });
    }
  },
})