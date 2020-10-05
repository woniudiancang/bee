const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {

  },
  onLoad: function (options) {
    
  },
  onShow: function () {
    this.queuingTypes()
    this.queuingMy()
  },
  async queuingTypes() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.queuingTypes()
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        list: res.data
      })
    }
  },
  async queuingMy() {
    const res = await WXAPI.queuingMy(wx.getStorageSync('token'))
    if (res.code == 0) {
      const mylist = []
      res.data.forEach(ele => {
        const queuingLog  = ele.queuingLog
        const queuingUpType = ele.queuingUpType
        const waitMinitus = (queuingLog.number - queuingUpType.curNumber -1) * queuingUpType.minitus
        if (waitMinitus) {
          queuingLog.waitMinitus = waitMinitus
        }
        queuingLog.typeEntity = queuingUpType
        mylist.push(queuingLog)
      })
      this.setData({
        mylist
      })
    }
  },
  async queuingGet(e) {
    const index = e.currentTarget.dataset.index
    const queueType = this.data.list[index]
    const isLogined = await AUTH.checkHasLogined()
    if (!isLogined) {
      AUTH.openLoginDialog()
      return
    }
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.queuingGet(wx.getStorageSync('token'), queueType.id)
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '取号成功'
      })
      this.queuingMy()
    }
  },
  processLogin(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    AUTH.register(this);
  },
})