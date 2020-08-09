const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  wx.setNavigationBarTitle({
    title: wx.getStorageSync('mallName')
  })
}

Page({
  data: {
    peisongType: 'zq', // zq 自取，kd 配送
    showCartPop: false, // 是否显示购物车列表
    showGoodsDetailPOP: false, // 是否显示商品详情
    showCouponPop: false, // 是否弹出优惠券领取提示
  },  
  onLoad: function () {
    // 设置标题
    const mallName = wx.getStorageSync('mallName')
    if (mallName) {
      wx.setNavigationBarTitle({
        title: mallName
      })
    }
    // 读取默认配送方式
    let peisongType = wx.getStorageSync('peisongType')
    if (!peisongType) {
      peisongType = 'zq'
      wx.setStorageSync('peisongType', peisongType)
    }
    this.setData({
      peisongType
    })
    // 读取最近的门店数据
    this.getshopInfo()
    this.categories()
    this._showCouponPop()
  },
  onShow: function(){
    this.shippingCarInfo()
  },
  getshopInfo(){
    wx.getLocation({
      type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        // console.log(res)
        this.data.latitude = res.latitude
        this.data.longitude = res.longitude
        this.fetchShops(res.latitude, res.longitude, '')
      },      
      fail(e){
        console.error(e)
        AUTH.checkAndAuthorize('scope.userLocation')
      }
    })
  },
  async fetchShops(latitude, longitude, kw){
    const res = await WXAPI.fetchShops({
      curlatitude: latitude,
      curlongitude: longitude,
      nameLike: kw,
      pageSize: 1
    })
    if (res.code == 0) {
      res.data.forEach(ele => {
        ele.distance = ele.distance.toFixed(1) // 距离保留3位小数
      })
      this.setData({
        shops: res.data,
        shopInfo: res.data[0]
      })
      wx.setStorageSync('shopInfo', res.data[0])
    } 
  },
  async _showCouponPop() {
    // 检测是否需要弹出优惠券的福袋
    const res = await WXAPI.coupons({
      token: wx.getStorageSync('token')
    })
    if (res.code == 0) {
      this.data.showCouponPop = true
    } else {
      this.data.showCouponPop = false
    }
    this.setData({
      showCouponPop: this.data.showCouponPop
    })
  },
  changePeisongType(e) {
    const peisongType = e.currentTarget.dataset.type
    this.setData({
      peisongType
    })
    wx.setStorage({
      data: peisongType,
      key: 'peisongType',
    })
  },
  // 获取分类
  async categories() {
    const res = await WXAPI.goodsCategory()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }    
    this.setData({
      categories: res.data,
      categorySelected: res.data[0]
    })
    this.getGoodsList()
  },
  async getGoodsList() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.goods({
      categoryId: this.data.categorySelected.id,
      page: 1,
      pageSize: 10000
    })
    wx.hideLoading()
    if (res.code == 700) {
      this.setData({
        goods: null
      });
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    res.data.forEach(ele => {
      if (!ele.characteristic) {
        ele.characteristic = '清凉一夏'
      }
    })
    this.setData({
      goods: res.data
    })
  },
  categoryClick(e) {
    const index = e.currentTarget.dataset.idx
    const categorySelected = this.data.categories[index]
    this.setData({
      categorySelected,
      scrolltop: 0
    })
    this.getGoodsList()
  },
  async shippingCarInfo() {
    const res = await WXAPI.shippingCarInfo(wx.getStorageSync('token'))
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
  showCartPop() {
    this.setData({
      showCartPop: !this.data.showCartPop
    })
  },
  hideCartPop() {
    this.setData({
      showCartPop: false
    })
  },
  async addCart1(e) {
    const token = wx.getStorageSync('token')
    const index = e.currentTarget.dataset.idx
    const item = this.data.goods[index]
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.shippingCarInfoAddItem(token, item.id, item.minBuyNumber, [])
    wx.hideLoading()
    if (res.code == 2000) {
      AUTH.openLoginDialog()
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.shippingCarInfo()
  },
  async skuClick(e) {
    const index1 = e.currentTarget.dataset.idx1
    const index2 = e.currentTarget.dataset.idx2
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.properties[index1].childsCurGoods.forEach(ele => {
      ele.selected = false
    })
    curGoodsMap.properties[index1].childsCurGoods[index2].selected = true
    this.setData({
      curGoodsMap
    })
    const canSubmit = this.skuCanSubmit()
    if (canSubmit) {
      // 读取价格
      let propertyChildIds = "";
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        propertyChildIds = propertyChildIds + big.id + ":" + small.id + ","
      })
      const res = await WXAPI.goodsPrice(curGoodsMap.basicInfo.id, propertyChildIds)
      if (res.code == 0) {
        curGoodsMap.price = res.data.price
        this.setData({
          curGoodsMap
        })
      }
    }
  },
  skuCanSubmit() {
    const curGoodsMap = this.data.curGoodsMap
    let canSubmit = true
    curGoodsMap.properties.forEach(big => {
      const small = big.childsCurGoods.find(ele => {
        return ele.selected
      })
      if (!small) {
        canSubmit = false
      }
    })
    return canSubmit
  },
  async addCart2() {
    const token = wx.getStorageSync('token')
    const curGoodsMap = this.data.curGoodsMap
    const canSubmit = this.skuCanSubmit()
    if (!canSubmit) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      })
      return
    }
    const sku = []
    curGoodsMap.properties.forEach(big => {
      const small = big.childsCurGoods.find(ele => {
        return ele.selected
      })
      sku.push({
        optionId: big.id,
        optionValueId: small.id
      })
    })
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.shippingCarInfoAddItem(token, curGoodsMap.basicInfo.id, curGoodsMap.number, sku)
    wx.hideLoading()
    if (res.code == 2000) {
      this.hideGoodsDetailPOP()
      AUTH.openLoginDialog()
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.hideGoodsDetailPOP()
    this.shippingCarInfo()
  },
  async cartStepChange(e) {
    const token = wx.getStorageSync('token')
    const index = e.currentTarget.dataset.idx
    const item = this.data.shippingCarInfo.items[index]
    if (e.detail < 1) {
      // 删除商品
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.shippingCarInfoRemoveItem(token, item.key)
      wx.hideLoading()
      if (res.code != 0) {
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
  goodsStepChange(e) {
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.number = e.detail
    this.setData({
      curGoodsMap
    })
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
  async showGoodsDetailPOP(e) {
    const index = e.currentTarget.dataset.idx
    const goodsId = this.data.goods[index].id
    const res = await WXAPI.goodsDetail(goodsId)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.hideTabBar()
    res.data.price = res.data.basicInfo.minPrice
    res.data.number = res.data.basicInfo.minBuyNumber
    this.setData({
      showGoodsDetailPOP: true,
      curGoodsMap: res.data
    })
  },
  hideGoodsDetailPOP() {
    wx.showTabBar()
    this.setData({
      showGoodsDetailPOP: false
    })
  },
  goPay() {
    wx.navigateTo({
      url: '/pages/pay/index',
    })
  },
  onShareAppMessage: function() {    
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')
    }
  },
  processLogin(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    AUTH.register(this);
  },
  couponOverlayClick() {
    this.setData({
      showCouponPop: false
    })
  },
  couponImageClick() {
    wx.navigateTo({
      url: '/pages/coupons/index',
    })
  },
})
