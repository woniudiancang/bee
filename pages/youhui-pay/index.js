const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {
    rechargeSendRules: []
  },
  onLoad: function (options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.my.youhuimaidan,
    })
    WXAPI.payBillDiscounts().then(res => {
      if (res.code === 0) {
        this.setData({
          rechargeSendRules: res.data
        });
      }
    })
  },
  onShow () {
    this.setData({
      shopInfo: wx.getStorageSync('shopInfo')
    })  
  },
  async bindSave(e) {
    const _this = this    
    const amount = e.detail.value.amount;
    console.log(amount)
    if (amount == "" || amount * 1 < 0) {
      wx.showToast({
        title: this.data.$t.youhuipay.amountRequired,
        icon: 'none'
      })
      return
    }
    const userMoney = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (userMoney.code == 2000) {
      AUTH.login(this)
      return
    }
    if (userMoney.code != 0) {
      wx.showToast({
        title: userMoney.msg,
        icon: 'none'
      })
      return
    }
    const rechargeSendRule = this.data.rechargeSendRules.sort((a, b) => {
      return b.consume - a.consume
    }).find(ele => {
      return amount >= ele.consume
    })
    let _msg = this.data.$t.youhuipay.curAmount + ' ￥' + amount + ' '
    let needPayAmount = amount*1
    if (rechargeSendRule) {
      needPayAmount -= rechargeSendRule.discounts
      _msg += ','+ this.data.$t.youhuipay.youhui +' ￥' + rechargeSendRule.discounts + ' '
    }
    if (userMoney.data.balance*1 > 0) {
      _msg += ',' + this.data.$t.order.balance + ' ￥' + userMoney.data.balance + ' '
    }
    needPayAmount = needPayAmount.toFixed(2) // 需要买单支付的金额
    const wxpayAmount = (needPayAmount - userMoney.data.balance).toFixed(2) // 需要额外微信支付的金额
    console.log(needPayAmount)
    console.log(wxpayAmount)
    
    if (wxpayAmount > 0) {
      _msg += ',' + this.data.$t.order.payAmount + ' ￥' + wxpayAmount
    }
    wx.showModal({
      content: _msg,
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      success: function (res) {
        console.log(res);
        if (res.confirm) {
          _this.goPay(amount, wxpayAmount)
        }
      }
    });
  },
  goPay(amount, wxpayAmount){
    const _this = this
    if (wxpayAmount > 0) {
      this.setData({
        paymentShow: true,
        money: wxpayAmount,
        nextAction: {
          type: 4,
          uid: wx.getStorageSync('uid'),
          money: amount
        }
      })
    } else {
      WXAPI.payBill(wx.getStorageSync('token'), amount).then(function (res) {
        if (res.code == 0) {
          wx.showModal({
            confirmText: _this.data.$t.common.confirm,
            cancelText: _this.data.$t.common.cancel,
            content: _this.data.$t.asset.success,
            showCancel: false
          })
        } else {
          wx.showModal({
            confirmText: _this.data.$t.common.confirm,
            cancelText: _this.data.$t.common.cancel,
            content: res.msg,
            showCancel: false
          })
        }        
      })
    }
  },
  paymentOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false
    })
    wx.redirectTo({
      url: '/pages/asset/index',
    })
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
})