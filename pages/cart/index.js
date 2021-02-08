const APP = getApp()
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  
}

Page({
  data: {

  },
  onLoad: function (options) {

  },
  onShow: function () {
    this.shippingCarInfo()
  },
  onPullDownRefresh() {
    this.shippingCarInfo()
    wx.stopPullDownRefresh()
  },
  async shippingCarInfo() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.shippingCarInfo(wx.getStorageSync('token'))
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        shippingCarInfo: res.data
      })
    } else {
      this.setData({
        shippingCarInfo: null,
        showCartPop: false
      })
    }
  },
  async cartStepChange(e) {
    const token = wx.getStorageSync('token')
    const index = e.currentTarget.dataset.idx
    const item = this.data.shippingCarInfo.items[index]
    if (e.detail < item.minBuyNumber) {
      // 删除商品
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.shippingCarInfoRemoveItem(token, item.key)
      wx.hideLoading()
      if (res.code != 0 && res.code != 700) {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        return
      }
      this.shippingCarInfo()
    } else {
      // 修改数量
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.shippingCarInfoModifyNumber(token, item.key, e.detail)
      wx.hideLoading()
      if (res.code != 0) {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        return
      }
      this.shippingCarInfo()
    }
  },
  async clearCart() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.shippingCarInfoRemoveAll(wx.getStorageSync('token'))
    wx.hideLoading()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.shippingCarInfo()
  },
  async goCreateOrder() {
    const goodsJsonStr = []
    this.data.shippingCarInfo.items.forEach(ele => {
      let propertyChildIds = ''
      if (ele.sku) {
        ele.sku.forEach(_sku => {
          propertyChildIds += `,${_sku.optionId}:${_sku.optionValueId}`
        })
      }
      goodsJsonStr.push({
        goodsId: ele.goodsId,
        number: ele.number,
        propertyChildIds,
      })
    })
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.cyTableAddOrder({
      token: wx.getStorageSync('token'),
      goodsJsonStr: JSON.stringify(goodsJsonStr)
    })
    wx.hideLoading()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    await this.clearCart()
    wx.redirectTo({
      url: '/pages/cart/order',
    })
  },
})