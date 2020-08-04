// pages/shop/detail.js
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()


Page({

  /**
   * 页面的初始数据
   */
  data: {
    markers: [],
    

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var shopInfo = wx.getStorageSync('shopInfo') 
    var marker = {
      latitude: shopInfo.latitude,
      longitude: shopInfo.longitude,
      iconPath: "/images/marker.png",
      height: 30,
      width: 30,
    }
    var markers = new Array()  
    markers.push(marker)     
    this.setData({      
      shopInfo,      
      markers,
    })
  },
  // 
  phoneCall:function(){
    var phoneNumber = this.data.shopInfo.linkPhone
    wx.makePhoneCall({
      phoneNumber,
      // phoneNumber: phoneNumber,
    })
  },
  // 
  guideNow: function(){
    var name = this.data.shopInfo.name
    var address = this.data.shopInfo.address
    var latitude = this.data.shopInfo.latitude
    var longitude = this.data.shopInfo.longitude
    wx.openLocation({
      name: name,
      address: address,
      latitude: latitude,
      longitude: longitude,
    })


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

})