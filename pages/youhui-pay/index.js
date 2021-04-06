import Dialog from '@vant/weapp/dialog/dialog'
const WXAPI = require('apifm-wxapi')
const wxpay = require('../../utils/pay.js')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {
    rechargeSendRules: []
  },
  // 
  confirm: function(){
    Dialog.alert({
      confirmButtonText:"确认支付",
      cancelButtonText:"取消支付",
      showCancelButton: true,
      title: '请确认买单金额',
      message: '本次买单300元\n满减优惠5元\n还需微信支付295.00元',
    }).then(() => {
      // on close
    });
  },
  onLoad: function (options) {   
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
        title: '请填写正确的消费金额',
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
    let _msg = '您本次消费 ' + amount + ' 元'
    let needPayAmount = amount*1
    if (rechargeSendRule) {
      needPayAmount -= rechargeSendRule.discounts
      _msg += ',优惠 ' + rechargeSendRule.discounts + ' 元'
    }
    if (userMoney.data.balance*1 > 0) {
      _msg += ',当前账户可用余额 ' + userMoney.data.balance + ' 元'
    }
    needPayAmount = needPayAmount.toFixed(2) // 需要买单支付的金额
    const wxpayAmount = (needPayAmount - userMoney.data.balance).toFixed(2) // 需要额外微信支付的金额
    console.log(needPayAmount)
    console.log(wxpayAmount)
    
    if (wxpayAmount > 0) {
      _msg += ',仍需微信支付 ' + wxpayAmount + ' 元'
    }
    wx.showModal({
      title: '请确认消费金额',
      content: _msg,
      confirmText: "确认支付",
      cancelText: "取消支付",
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
      wxpay.wxpay('paybill', wxpayAmount, 0, "/pages/asset/index", { money: amount});
    } else {
      WXAPI.payBill(wx.getStorageSync('token'), amount).then(function (res) {
        if (res.code == 0) {
          wx.showModal({
            title: '成功',
            content: '买单成功，欢迎下次光临！',
            showCancel: false
          })
        } else {
          wx.showModal({
            title: '失败',
            content: res.msg,
            showCancel: false
          })
        }        
      })
    }
  },
})