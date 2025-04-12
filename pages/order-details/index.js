const APP = getApp();
const WXAPI = require('apifm-wxapi')
APP.configLoadOK = () => {
  wx.setNavigationBarTitle({
    title: wx.getStorageSync('mallName')
  })
}
const wxbarcode = require('wxbarcode')

Page({
    data:{
      
    },
    onLoad(e){
      getApp().initLanguage(this)
      wx.setNavigationBarTitle({
        title: this.data.$t.order.detail,
      })
      // e.id = 1234
      // e.payOrderNo = 'ZF2411231847541110'
      this.setData({
        orderId: e.id,
        payOrderNo: e.payOrderNo,
      })
      if (e.payOrderNo) {
        this.payLogs()
      }
    },
    onShow : function () {
      this.orderDetail()
    },
    async payLogs() {
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.payLogs({
        token: wx.getStorageSync('token'),
        orderNo: this.data.payOrderNo
      })
      wx.hideLoading()
      if (res.code != 0) {
        wx.showModal({
          content: res.msg,
          showCancel: false
        })
        return
      }
      const nextAction = res.data[0].nextAction
      if(!nextAction) {
        wx.navigateTo({
          url: '/pages/asset/index',
        })
        return
      }
      const _nextAction = JSON.parse(nextAction)
      if (_nextAction.type != 0) {
        wx.navigateTo({
          url: '/pages/asset/index',
        })
        return
      }
      this.setData({
        orderId: _nextAction.id,
      })
      this.orderDetail()
    },
    async orderDetail() {
      if (!this.data.orderId) {
        return
      }
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.orderDetail(wx.getStorageSync('token'), this.data.orderId)
      wx.hideLoading()
      if (res.code != 0) {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: res.msg,
          showCancel: false
        })
        return
      }
      // 绘制核销码
      if (res.data.orderInfo.hxNumber && res.data.orderInfo.status == 1) {
        wxbarcode.qrcode('qrcode', res.data.orderInfo.hxNumber, 400, 400);
      }        
      this.setData({
        orderDetail: res.data
      })
      if (res.data.orderInfo.shopIdZt) {
        this.shopSubdetail()
      }
    },
    async shopSubdetail() {
      const res = await WXAPI.shopSubdetail(this.data.orderDetail.orderInfo.shopIdZt)
      if (res.code == 0) {
        this.setData({
          shopSubdetail: res.data
        })
      }
    },
    async toPayTap() {
      // 立即支付
      let res = await WXAPI.userAmount(wx.getStorageSync('token'))
      if (res.code != 0) {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        return
      }
      const balance = res.data.balance // 当前用户的余额
      let needPay = this.data.orderDetail.orderInfo.amountReal*1 - balance*1
      needPay = needPay.toFixed(2)
      if (needPay <= 0) {
        // 余额足够
        WXAPI.orderPay(wx.getStorageSync('token'), this.data.orderDetail.orderInfo.id).then(res => {
          wx.showToast({
            title: this.data.$t.asset.success,
            icon: 'success'
          })
          this.orderDetail();
        })
      } else {
        // 微信支付
        this.setData({
          paymentShow: true,
          money: needPay,
          orderId: this.data.orderDetail.orderInfo.id,
          nextAction: {
            type: 0,
            id: this.data.orderDetail.orderInfo.id
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
    callshop() {
      wx.makePhoneCall({
        phoneNumber: this.data.shopSubdetail.info.linkPhone,
      })
    },
    wuliuDetailsTap:function(e){
      var orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: "/pages/wuliu/index?id=" + orderId
      })
    },
    confirmBtnTap(e){
      let that = this;
      let orderId = this.data.orderId;
      wx.showModal({
        confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.order.askConfirm,
          success: function(res) {
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
    }
})