const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}
Page({
  data: {
    persionNum: ['1-2人', '3-4人', '5-8人', '8人以上'],
    persionNumIndex: 0,
    showDatetimePop: false,
    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'day') {
        return `${value}日`;
      } else if (type === 'hour') {
        return `${value}点`;
      } else if (type === 'minute') {
        return `${value}分`;
      }
      return value;
    },
    filter(type, options) {
      if (type === 'minute') {
        return options.filter((option) => option % 10 === 0);
      }
      return options;
    },
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
  },
  onLoad: function (options) {

  },
  onShow: function () {
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        wx.showModal({
          content: '登陆后才能访问',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    })
  },
  changePersionNum(e) {
    this.setData({
      persionNumIndex: e.currentTarget.dataset.idx
    })
  },
  async submit() {
    if (!this.data.name) {
      wx.showToast({
        title: '请填写姓名',
        icon: 'none'
      })
      return
    }
    if (!this.data.mobile) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      })
      return
    }
    if (!this.data.time) {
      wx.showToast({
        title: '请选择到店时间',
        icon: 'none'
      })
      return
    }
    const extJsonStr = {}
    extJsonStr['姓名'] = this.data.name
    extJsonStr['联系电话'] = this.data.mobile
    extJsonStr['到店时间'] = this.data.time
    extJsonStr['用餐人数'] = this.data.persionNum[this.data.persionNumIndex]
    const res = await WXAPI.yuyueJoin({
      token: wx.getStorageSync('token'),
      yuyueId: wx.getStorageSync('zxdz'),
      extJsonStr: JSON.stringify(extJsonStr)
    })
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1000);
    }
  },
  showDatetimePop() {
    this.setData({
      showDatetimePop: true
    })
  },
  hideDatetimePop() {
    this.setData({
      showDatetimePop: false
    })
  },
  confirm(e) {
    const newDate = new Date(e.detail)
    this.setData({
      time: newDate.toLocaleString()
    })
    this.hideDatetimePop()
  },
})