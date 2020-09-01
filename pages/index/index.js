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
    shopIsOpened: false, // 是否营业

    showPingtuanPop: false,
    share_goods_id: undefined,
    share_pingtuan_open_id: undefined,
    lijipingtuanbuy: false,
    pingtuan_open_id: undefined
  },  
  onLoad: function (e) {
    // e = {
    //   share_goods_id: 521055,
    //   share_pingtuan_open_id: 11267
    // }
    if (e.share_goods_id) {
      this.data.share_goods_id = e.share_goods_id
      this._showGoodsDetailPOP(e.share_goods_id)
    }
    if (e.share_pingtuan_open_id) {
      this.data.share_pingtuan_open_id = e.share_pingtuan_open_id
    } else {
      this._showCouponPop()
    }
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
    this.noticeLastOne()
    this.banners()
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
        shopInfo: res.data[0],
        shopIsOpened: this.checkIsOpened(res.data[0].openingHours)
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
      if (curGoodsMap.properties) {
        curGoodsMap.properties.forEach(big => {
          const small = big.childsCurGoods.find(ele => {
            return ele.selected
          })
          propertyChildIds = propertyChildIds + big.id + ":" + small.id + ","
        })
      }
      const res = await WXAPI.goodsPrice(curGoodsMap.basicInfo.id, propertyChildIds)
      if (res.code == 0) {
        if (this.data.lijipingtuanbuy) {
          curGoodsMap.price = res.data.pingtuanPrice
        } else {
          curGoodsMap.price = res.data.price
        }
        this.setData({
          curGoodsMap
        })
      }
    }
  },
  skuCanSubmit() {
    const curGoodsMap = this.data.curGoodsMap
    let canSubmit = true
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        if (!small) {
          canSubmit = false
        }
      })
    }
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
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        sku.push({
          optionId: big.id,
          optionValueId: small.id
        })
      })
    }
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
    this._showGoodsDetailPOP(goodsId)
  },
  async _showGoodsDetailPOP(goodsId) {
    const token = wx.getStorageSync('token')
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
    const _data = {
      curGoodsMap: res.data,
      pingtuan_open_id: null,
      lijipingtuanbuy: false
    }
    if (res.data.basicInfo.pingtuan) {
      _data.showPingtuanPop = true
      _data.showGoodsDetailPOP = false
      // 获取拼团设置
      const resPintuanSet = await WXAPI.pingtuanSet(goodsId)
      if (resPintuanSet.code != 0) {
        _data.showPingtuanPop = false
        _data.showGoodsDetailPOP = true
      } else {
        _data.pintuanSet = resPintuanSet.data
        // 是否是别人分享的团进来的
        if (this.data.share_goods_id && this.data.share_goods_id == goodsId && this.data.share_pingtuan_open_id) {
          // 分享进来的
          _data.pingtuan_open_id = this.data.share_pingtuan_open_id
        } else {
          // 不是通过分享进来的
          const resPintuanOpen = await WXAPI.pingtuanOpen(token, goodsId)
          if (resPintuanOpen.code == 2000) {
            AUTH.openLoginDialog()
            return
          }
          if (resPintuanOpen.code != 0) {
            wx.showToast({
              title: resPintuanOpen.msg,
              icon: 'none'
            })
            return
          }
          _data.pingtuan_open_id = resPintuanOpen.data.id
        }
        // 读取拼团记录
        const helpUsers = []
        for (let i = 0; i < _data.pintuanSet.numberOrder; i++) {
          helpUsers[i] = '/images/who.png'
        }
        _data.helpNumers = 0
        const resPingtuanJoinUsers = await WXAPI.pingtuanJoinUsers(_data.pingtuan_open_id)
        if (resPingtuanJoinUsers.code == 700 && this.data.share_pingtuan_open_id) {
          this.data.share_pingtuan_open_id = null
          this._showGoodsDetailPOP(goodsId)
          return
        }
        if (resPingtuanJoinUsers.code == 0) {
          _data.helpNumers = resPingtuanJoinUsers.data.length
          resPingtuanJoinUsers.data.forEach((ele, index) => {
            if (_data.pintuanSet.numberOrder > index) {
              helpUsers.splice(index, 1, ele.apiExtUserHelp.avatarUrl)
            }
          })
        }
        _data.helpUsers = helpUsers
      }
    } else {
      _data.showPingtuanPop = false
      _data.showGoodsDetailPOP = true
    }
    this.setData(_data)
  },
  hideGoodsDetailPOP() {
    this.setData({
      showGoodsDetailPOP: false,
      showPingtuanPop: false
    })
    wx.showTabBar()
  },
  goPay() {
    wx.navigateTo({
      url: '/pages/pay/index',
    })
  },
  onShareAppMessage: function() {
    let uid = wx.getStorageSync('uid')
    if (!uid) {
      uid = ''
    }
    let path = '/pages/index/index?inviter_id=' + uid
    if (this.data.pingtuan_open_id) {
      path = path + '&share_goods_id=' +  this.data.curGoodsMap.basicInfo.id + '&share_pingtuan_open_id=' +  this.data.pingtuan_open_id
    }
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path
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
  async noticeLastOne() {
    const res = await WXAPI.noticeLastOne()
    if (res.code == 0) {
      this.setData({
        noticeLastOne: res.data
      })
    }
  },
  goNotice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notice/detail?id=' + id,
    })
  },
  async banners() {
    const res = await WXAPI.banners()
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
  checkIsOpened(openingHours) {
    const date = new Date();
    const startTime = openingHours.split('-')[0]
    const endTime = openingHours.split('-')[1]
    const dangqian=date.toLocaleTimeString('chinese',{hour12:false})
    
    const dq=dangqian.split(":")
    const a = startTime.split(":")
    const b = endTime.split(":")

    const dqdq=date.setHours(dq[0],dq[1])
    const aa=date.setHours(a[0],a[1])
    const bb=date.setHours(b[0],b[1])
    
    return aa<dqdq && dqdq<bb
  },
  yuanjiagoumai() {
    this.setData({
      showPingtuanPop: false,
      showGoodsDetailPOP: true
    })
  },
  _lijipingtuanbuy() {
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.price = curGoodsMap.basicInfo.pingtuanPrice
    this.setData({
      curGoodsMap,
      showPingtuanPop: false,
      showGoodsDetailPOP: true,
      lijipingtuanbuy: true
    })
  },
  pingtuanbuy() {
    // 加入 storage 里
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
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        sku.push({
          optionId: big.id,
          optionValueId: small.id
        })
      })
    }
    const pingtuanGoodsList = []
    pingtuanGoodsList.push({
      goodsId: curGoodsMap.basicInfo.id,
      number: curGoodsMap.number,
      categoryId: curGoodsMap.basicInfo.categoryId,
      shopId: curGoodsMap.basicInfo.shopId,
      price: curGoodsMap.price,
      score: curGoodsMap.basicInfo.score,
      pic: curGoodsMap.basicInfo.pic,
      name: curGoodsMap.basicInfo.name,
      minBuyNumber: curGoodsMap.basicInfo.minBuyNumber,
      logisticsId: curGoodsMap.basicInfo.logisticsId,
      sku
    })
    wx.setStorageSync('pingtuanGoodsList', pingtuanGoodsList)
    // 跳转
    wx.navigateTo({
      url: '/pages/pay/index?orderType=buyNow&pingtuanOpenId=' + this.data.pingtuan_open_id,
    })
  },
  _lijipingtuanbuy2() {
    this.data.share_pingtuan_open_id = null
    this._showGoodsDetailPOP(this.data.curGoodsMap.basicInfo.id)
  }
})
