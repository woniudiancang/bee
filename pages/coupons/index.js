const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}
Page({
  data: {
    tabIndex: 0
  },
  onLoad: function (options) {
    if (options.tabIndex) {
      this.setData({
        tabIndex: options.tabIndex*1
      })
    }
    this.fetchData()
  },
  tabChange(event) {
    this.setData({
      tabIndex: event.detail.name
    })
    this.fetchData()
  },
  fetchData() {
    if (this.data.tabIndex == 0) {
      this.coupons()
    } else {
      this.mycoupons()
    }
  },
  onShow: function () {

  },
  async coupons() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.coupons({
      token: wx.getStorageSync('token')
    })
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        coupons: res.data.filter(ele => {
          return !ele.pwd
        })
      })
    } else {
      this.setData({
        coupons: null
      })
    }
  },
  async fetchCounpon(e) {
    const idx = e.currentTarget.dataset.idx
    const coupon = this.data.coupons[idx]
    const res = await WXAPI.fetchCoupons({
      id: coupon.id,
      token: wx.getStorageSync('token')
    })
    if (res.code == 20001 || res.code == 20002) {
      wx.showToast({
        title: '来晚了',
        icon: 'none'
      })
      return;
    }
    if (res.code == 20003) {
      wx.showToast({
        title: '你领过了，别贪心哦',
        icon: 'none'
      })
      return;
    }
    if (res.code == 30001) {
      wx.showToast({
        title: '您的积分不足',
        icon: 'none'
      })
      return;
    }
    if (res.code == 20004) {
      wx.showToast({
        title: '已过期',
        icon: 'none'
      })
      return;
    }
    if (res.code == 0) {
      wx.showToast({
        title: '领取成功',
        icon: 'success'
      })
      setTimeout(() => {
        this.coupons()
      }, 1000);
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  async mycoupons() {
    wx.showLoading({
      title: '',
    })
    let status = '0'
    if (this.data.tabIndex == 2) {
      status = '1,2,3'
    }
    const res = await WXAPI.myCoupons({
      token: wx.getStorageSync('token'),
      status
    })
    wx.hideLoading()
    if (res.code == 0) {
      res.data.forEach(ele => {
        ele.dateEnd = ele.dateEnd.split(' ')[0]
      })
      this.setData({
        mycoupons: res.data
      })
    } else {
      this.setData({
        mycoupons: null
      })
    }
  },
})