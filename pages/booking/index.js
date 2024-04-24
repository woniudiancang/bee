const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}
Page({
  data: {
    persionNum: { // 每种语言列举
      zh_CN: ['1-2人', '3-4人', '5-8人', '8人以上'],
      en: ['1-2 Person', '3-4 Person', '5-8 Person', 'More than 8'],
    },
    persionNumIndex: 0,
    showDatetimePop: false,
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
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.booking.title,
    })
    this.setData({
      formatter: (type, value) => {
        if (type === 'year') {
          return `${value}` + this.data.$t.date.year;
        } else if (type === 'month') {
          return `${value}` + this.data.$t.date.month;
        } else if (type === 'day') {
          return `${value}` + this.data.$t.date.day;
        } else if (type === 'hour') {
          return `${value}` + this.data.$t.date.hour;
        } else if (type === 'minute') {
          return `${value}` + this.data.$t.date.minutes;
        }
        return value;
      }
    })
  },
  onShow: function () {
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.auth.needLogin,
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
        title: this.data.$t.booking.namePlaceholder,
        icon: 'none'
      })
      return
    }
    if (!this.data.mobile) {
      wx.showToast({
        title: this.data.$t.booking.mobilePlaceholder,
        icon: 'none'
      })
      return
    }
    if (!this.data.time) {
      wx.showToast({
        title: this.data.$t.booking.timePlaceholder,
        icon: 'none'
      })
      return
    }
    const extJsonStr = {}
    extJsonStr['姓名'] = this.data.name
    extJsonStr['联系电话'] = this.data.mobile
    extJsonStr['到店时间'] = this.data.time
    extJsonStr['用餐人数'] = this.data.persionNum['zh_CN'][this.data.persionNumIndex]
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
        title: this.data.$t.common.submitSuccess,
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