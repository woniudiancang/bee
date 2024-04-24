const WXAPI = require('apifm-wxapi')
const APP = getApp()
APP.configLoadOK = () => {

}

Page({
  data: {
    
  },
  onLoad: function (e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.my.scanHx,
    })
    // e.hxNumber = '2008010532287842'
    this.setData({
      hxNumber: e.hxNumber
    });
  },
  onShow: function () {
    var that = this;
    WXAPI.orderDetail(wx.getStorageSync('token'), '', this.data.hxNumber).then(function (res) {
      if (res.code != 0) {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: res.msg,
          showCancel: false
        })
        return;
      }
      that.setData({
        orderDetail: res.data
      });
    })
  },
  wuliuDetailsTap: function (e) {
    var orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/wuliu/index?id=" + orderId
    })
  },
  confirmBtnTap(e) {
    let that = this;
    let orderId = this.data.orderId;
    wx.showModal({
      content: this.data.$t.order.askConfirm,
      confirmText: this.data.$t.common.confirm,
      cancelText: this.data.$t.common.cancel,
      success: function (res) {
        if (res.confirm) {
          WXAPI.orderDelivery(wx.getStorageSync('token'), orderId).then(function (res) {
            if (res.code == 0) {
              that.onShow();
            }
          })
        }
      }
    })
  },
  submitReputation: function (e) {
    let that = this;
    let postJsonString = {};
    postJsonString.token = wx.getStorageSync('token');
    postJsonString.orderId = this.data.orderId;
    let reputations = [];
    let i = 0;
    while (e.detail.value["orderGoodsId" + i]) {
      let orderGoodsId = e.detail.value["orderGoodsId" + i];
      let goodReputation = e.detail.value["goodReputation" + i];
      let goodReputationRemark = e.detail.value["goodReputationRemark" + i];

      let reputations_json = {};
      reputations_json.id = orderGoodsId;
      reputations_json.reputation = goodReputation;
      reputations_json.remark = goodReputationRemark;

      reputations.push(reputations_json);
      i++;
    }
    postJsonString.reputations = reputations;
    WXAPI.orderReputation({
      postJsonString: JSON.stringify(postJsonString)
    }).then(function (res) {
      if (res.code == 0) {
        that.onShow();
      }
    })
  },
  async doneHx(){
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/sq4sma
    const res = await WXAPI.orderHXV2({
      token: wx.getStorageSync('token'),
      hxNumber: this.data.hxNumber
    })
    wx.hideLoading()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: this.data.$t.order.VerificationCompleted,
        icon: 'success'
      })
      this.onShow()
    }
  },
})