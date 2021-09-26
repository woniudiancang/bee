const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

Page({
  data: {

  },
  onLoad: function (options) {
    
  },
  onShow: function () {
    AUTH.checkHasLogined().then(isLogin => {
      if (isLogin) {
        this.queuingTypes()
        this.queuingMy()
        AUTH.bindSeller()
      } else {
        AUTH.authorize().then(res => {
          this.queuingTypes()
          this.queuingMy()
          AUTH.bindSeller()
        })
      }
    })
    
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
      AUTH.login(this)
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
})