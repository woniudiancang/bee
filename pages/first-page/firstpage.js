// pages/firstpage/firstpage.js
const WXAPI = require('apifm-wxapi')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    banners: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.banners()
  },

  async banners() {
    const res = await WXAPI.banners()
    if (res.code == 0) {
      this.setData({
        banners : res.data.filter((item, i, arr) => {
          return item.type === "3"
        })
      })
      // console.log(this.data.banners)
    }
  },
  goDetail()
  {
    wx.switchTab({
      url: '/pages/index/index',
    })
    // wx.showToast({
    //   title: '页面还在建设中...',
    //   icon: 'error'
    // })
  },
  goLogin(){
      wx.showToast({
      title: '页面还在建设中...',
      icon: 'error'
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})