const WXAPI = require('apifm-wxapi')
const wxbarcode = require('wxbarcode')
const APP = getApp()
APP.configLoadOK = () => {

}
Page({
  data: {
    apiOk: false
  },
  onLoad: function (options) {
    
  },
  onShow: function () {
    this.orderList()
  },
  toIndexPage: function() {
    wx.switchTab({
      url: "/pages/index/index"
    });
  },
  async orderList() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.orderList({
      token: wx.getStorageSync('token'),
      statusBatch: '1,2'
    })
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        orderList: res.data.orderList,
        logisticsMap: res.data.logisticsMap,
        goodsMap: res.data.goodsMap,
        apiOk: true
      })
      wxbarcode.qrcode('qrcode_0', res.data.orderList[0].hxNumber, 400, 400);
    } else {
      this.setData({
        orderList: null,
        logisticsMap: null,
        goodsMap: null,
        apiOk: true
      })
    }
  },
  bindchange(e) {
    const index = e.detail.current
    const hxNumber = this.data.orderList[index].hxNumber
    if (!hxNumber) {
      return
    }    
    wxbarcode.qrcode('qrcode_' + index, hxNumber, 400, 400);
  },
})