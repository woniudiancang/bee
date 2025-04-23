const WXAPI = require('apifm-wxapi')
Page({
  data: {
    active: 0
  },
  onLoad(e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.card.title,
    })
    this.banners()
    this.cardList()
  },
  onShow() {
    const cardmyrefresh = wx.getStorageSync('cardmyrefresh')
    if (cardmyrefresh) {
      wx.removeStorageSync('cardmyrefresh')
      this.setData({
        active: 1
      })
      this.cardMyList()
    }
  },
  tabChange(e) {
    this.setData({
      active: e.detail.index
    })
    if (e.detail.index == 1) {
      // 我的礼品卡
      this.cardMyList()
    }
  },
  onShareAppMessage() {
    return {
      title: this.data.$t.card.title,
      path: '/pages/card/index?inviter_id=' + (wx.getStorageSync('uid') || ''),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  onShareTimeline() {
    return {
      title: this.data.$t.card.title,
      query: 'inviter_id=' + (wx.getStorageSync('uid') || ''),
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  async banners() {
    // https://www.yuque.com/apifm/nu0f75/ms21ki
    const res = await WXAPI.banners({
      type: 'card'
    })
    if (res.code == 0) {
      this.setData({
        banners: res.data
      })
    }
  },
  tapBanner(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  async cardList() {
    // https://www.yuque.com/apifm/nu0f75/lx3wdf
    const res = await WXAPI.cardList({
      status: 0
    })
    if (res.code == 0) {
      this.setData({
        cardList: res.data
      })
    }
  },
  async cardMyList() {
    // https://www.yuque.com/apifm/nu0f75/dcm1fi
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.cardMyList(wx.getStorageSync('token'))
    wx.hideLoading()
    if (res.code == 0) {
      this.setData({
        cardMyList: res.data
      })
    } else {
      this.setData({
        cardMyList: null
      })
    }
  },
  buy(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      paymentShow: true,
      money: item.price,
      remark: this.data.$t.card.buy + ': ' + item.name,
      nextAction: { // https://www.yuque.com/apifm/doc/aetmlb
        type: 10,
        id: item.id
      }
    })
  },
  paymentOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false,
      active: 1
    })
    this.cardMyList()
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
})