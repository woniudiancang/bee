const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {
    apiOk: false
  },
  cancelOrderTap: function(e) {
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      content: this.data.$t.order.cancelProfile,
      success: function(res) {
        if (res.confirm) {
          WXAPI.orderClose(wx.getStorageSync('token'), orderId).then(function(res) {
            if (res.code == 0) {
              that.onShow();
            }
          })
        }
      }
    })
  },
  toPayTap: function(e) {
    // 防止连续点击--开始
    if (this.data.payButtonClicked) {
      wx.showToast({
        title: this.data.$t.common.doubleClick,
        icon: 'none'
      })
      return
    }
    this.data.payButtonClicked = true
    setTimeout(() => {
      this.data.payButtonClicked = false
    }, 3000)  // 可自行修改时间间隔（目前是3秒内只能点击一次支付按钮）
    // 防止连续点击--结束
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    let money = e.currentTarget.dataset.money;
    const needScore = e.currentTarget.dataset.score;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function(res) {
      if (res.code == 0) {
        // 增加提示框
        if (res.data.score < needScore) {
          wx.showToast({
            title: that.data.$t.order.scoreNotEnough,
            icon: 'none'
          })
          return;
        }
        let _msg = that.data.$t.order.amountReal + ' ' + money
        if (res.data.balance > 0) {
          _msg += ' ' + that.data.$t.order.balance + ' ' + res.data.balance
          if (money - res.data.balance > 0) {
            _msg += ' ' + that.data.$t.order.payAmount + ' ' + (money - res.data.balance)
          }          
        }
        if (needScore > 0) {
          _msg += ' ' + that.data.$t.order.payScore + ' ' + needScore
        }
        money = money - res.data.balance
        wx.showModal({
          content: _msg,
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
          success: function (res) {
            console.log(res);
            if (res.confirm) {
              that._toPayTap(orderId, money)
            }
          }
        });
      } else {
        wx.showModal({
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
          content: that.data.$t.order.noCashAccount,
          showCancel: false
        })
      }
    })
  },
  _toPayTap: function (orderId, money){
    const _this = this
    if (money <= 0) {
      // 直接使用余额支付
      WXAPI.orderPay(wx.getStorageSync('token'), orderId).then(function (res) {
        _this.onShow();
      })
    } else {
      this.setData({
        paymentShow: true,
        orderId,
        money,
        nextAction: {
          type: 0,
          id: orderId
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
      url: '/pages/all-orders/index',
    })
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
  onLoad: function(options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.order.title,
    })
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.doneShow();
      } else {
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
  async doneShow() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.orderList({
      token: wx.getStorageSync('token')
    })
    wx.hideLoading()
    if (res.code == 0) {
      const orderList = res.data.orderList
      orderList.forEach(ele => {
        if (ele.status == -1) {
          ele.statusStr = this.data.$t.order.status.st01
        }
        if (ele.status == 1 && ele.isNeedLogistics) {
          ele.statusStr = this.data.$t.order.status.st11
        }
        if (ele.status == 1 && !ele.isNeedLogistics) {
          ele.statusStr = this.data.$t.order.status.st10
        }
        if (ele.status == 3) {
          ele.statusStr = this.data.$t.order.status.st3
        }
      })
      this.setData({
        orderList: res.data.orderList,
        logisticsMap: res.data.logisticsMap,
        goodsMap: res.data.goodsMap,
        apiOk: true
      });
      
    } else {
      this.setData({
        orderList: null,
        logisticsMap: {},
        goodsMap: {},
        apiOk: true
      });
    }
  },
  toIndexPage: function() {
    wx.switchTab({
      url: "/pages/index/index"
    });
  },
  // 删除订单
  deleteOrder: function(e){
    const that = this
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      content: this.data.$t.order.deleteProfile,
      success: function (res) {
        if (res.confirm) {
          WXAPI.orderDelete(wx.getStorageSync('token'), id).then(function (res) {  
            if (res.code == 0) {
              that.onShow(); //重新获取订单列表
            }              
            
          })
        }
      }
    })
  },
  async callShop(e) {
    const shopId = e.currentTarget.dataset.shopid
    const res = await WXAPI.shopSubdetail(shopId)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.makePhoneCall({
      phoneNumber: res.data.info.linkPhone,
    })
  },
})