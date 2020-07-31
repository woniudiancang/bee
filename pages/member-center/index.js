const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {
  
}

Page({
  data: {
    totleConsumed: 0
  },
  onLoad: function (options) {
    this.userLevelList()
    this.userAmount()
    this.getUserApiInfo()
  },
  onShow: function () {
    
  },
  async userAmount() {
    const res = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        totleConsumed: res.data.totleConsumed
      });
    }
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        apiUserInfoMap: res.data
      });
    }
  },
  async userLevelList() {
    const res = await WXAPI.userLevelList()
    if (res.code == 0) {
      this.setData({
        levelList: res.data.result
      });
    }
  },
})