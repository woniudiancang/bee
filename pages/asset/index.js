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
        title: '请输入充值金额',
        icon: 'none'
      })
      return
    }
    this.wxpay(this.data.amount2);
  },
  wxpay(money) {
    const _this = this
    const postData = {
      token: wx.getStorageSync('token'),
      money: money,
      payName: "在线充值",
      remark: "在线充值",
    }
    WXAPI.wxpay(postData).then(res => {
      if (res.code == 0) {
        // 发起支付
        wx.requestPayment({
          timeStamp: res.data.timeStamp,
          nonceStr: res.data.nonceStr,
          package: res.data.package,
          signType: res.data.signType,
          paySign: res.data.paySign,
          fail: function (aaa) {
            console.error(aaa)
            wx.showToast({
              title: '支付失败:' + aaa
            })
          },
          success: function () {
            // 提示支付成功
            wx.showToast({
              title: '支付成功'
            })
            _this.setData({
              showRechargePop: false
            })
            _this.getUserAmount()
          }
        })
      } else {
        wx.showModal({
          title: '出错了',
          content: JSON.stringify(res),
          showCancel: false
        })      
      }
    })
  }
})