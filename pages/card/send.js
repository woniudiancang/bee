const WXAPI = require('apifm-wxapi')
Page({
  data: {
    autosize: {
      minHeight: 100
    },
  },
  onLoad (e) {
    wx.hideShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.card.cardShareOpen,
    })
    this.setData({
      cardUser: wx.getStorageSync('sendCard'),
      remark: this.data.$t.card.shareplaceholder
    })
    this.cardShareOpen()
    wx.setStorageSync('cardmyrefresh', true)
  },
  async cardShareOpen() {
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/xevcthfroio6xnc0
    const res = await WXAPI.cardShareOpen({
      token: wx.getStorageSync('token'),
      id: this.data.cardUser.id,
      remark: this.data.remark,
    })
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        shareToken: res.data
      })
    }
  },
  onShareAppMessage(e) {
    const promise = new Promise(resolve => {
      WXAPI.cardShareOpen({
        token: wx.getStorageSync('token'),
        id: this.data.cardUser.id,
        remark: this.data.remark,
      }).then( res => {
        if (res.code == 0) {
          this.setData({
            shareToken: res.data
          })
          resolve({
            title: this.data.remark,
            path: '/pages/card/receive?inviter_id=' + (wx.getStorageSync('uid') || '') + '&id='+ this.data.cardUser.id +'&shareToken=' + this.data.shareToken,
            imageUrl: this.data.cardUser.cardInfo.pic,
          })
        }
      })
    })
    return {
      title: this.data.remark,
      path: '/pages/card/receive?inviter_id=' + (wx.getStorageSync('uid') || '') + '&id='+ this.data.cardUser.id +'&shareToken=' + this.data.shareToken,
      imageUrl: this.data.cardUser.cardInfo.pic,
      promise
    }
  },
})