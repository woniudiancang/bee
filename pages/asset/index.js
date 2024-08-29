const APP = getApp()
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    balance: 0.00,
    ruleSelIndex: 0,
    showRechargePop: false
  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.asset.title,
    })
    this.rechargeRule()
  },
  onShow: function () {
    this.getUserAmount()
  },
  async getUserAmount() {
    const res = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        balance: res.data.balance.toFixed(2),
        freeze: res.data.freeze.toFixed(2),
        score: res.data.score,
        growth: res.data.growth
      })
    }
  },
  async rechargeRule() {
    const res = await WXAPI.rechargeSendRules()
    if (res.code == 0) {
      this.setData({
        rechargeSendRules: res.data
      })
    }
  },
  changePersionNum(e) {
    if (e.currentTarget.dataset.idx == -1) {
      this.data.showRechargePop = true
    }
    this.setData({
      ruleSelIndex: e.currentTarget.dataset.idx,
      showRechargePop: this.data.showRechargePop,
      amount2: null
    })
  },
  submit1() {
    if (this.data.ruleSelIndex == -1) {
      this.setData({
        showRechargePop: true,
        amount2: null
      })
      return
    }
    const amount = this.data.rechargeSendRules[this.data.ruleSelIndex].confine
    this.wxpay(amount);
  },
  onClose() {
    this.setData({
      showRechargePop: false
    })
  },
  submit2() {
    if (!this.data.amount2) {
      wx.showToast({
        title: this.data.$t.asset.amountPlaceholder,
        icon: 'none'
      })
      return
    }
    this.wxpay(this.data.amount2);
  },
  wxpay(money) {
    this.setData({
      paymentShow: true,
      money
    })
  },
  paymentOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false,
      showRechargePop: false
    })
    this.getUserAmount()
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
})