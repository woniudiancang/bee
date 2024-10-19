const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')
Page({
  data: {
    page: 1,
    peisongType: 'zq', // zq 自取，kd 配送
    showCartPop: false, // 是否显示购物车列表
    showGoodsDetailPOP: false, // 是否显示商品详情
    showCouponPop: false, // 是否弹出优惠券领取提示
    shopIsOpened: false, // 是否营业

    showPingtuanPop: false,
    share_goods_id: undefined,
    share_pingtuan_open_id: undefined,
    lijipingtuanbuy: false,
    pingtuan_open_id: undefined,
    menuButtonBoundingClientRect: wx.getMenuButtonBoundingClientRect(),
  },  
  onLoad: function (e) {
    getApp().initLanguage(this)
    const _data = {}
    // 测试拼团入口
    // e = {
    //   share_goods_id: 521055,
    //   share_pingtuan_open_id: 11267
    // }

    // 测试扫码点餐
    // shopId=36,id=111,key=Y6RoIT 进行 url编码，3个值分别为 门店id，餐桌id，餐桌密钥
    // e = {
    //   scene: 'shopId%3d12879%2cid%3d111%2ckey%3dY6RoIT' 
    // }

    let mod = 0 // 0 普通模式； 1 扫码点餐模式
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length == 3) {
        // 扫码点餐
        const scanDining = {}
        scene.split(',').forEach(ele => {
          scanDining[ele.split('=')[0]] = ele.split('=')[1]
        })
        wx.setStorageSync('scanDining', scanDining)
        _data.scanDining = scanDining
        this.cyTableToken(scanDining.id, scanDining.key)
        mod = 1
      } else {
        wx.removeStorageSync('scanDining')
      }
    }
    if (wx.getStorageSync('scanDining')) {
      mod = 1
      _data.scanDining = wx.getStorageSync('scanDining')
      wx.hideTabBar()
    }
    this.setData(_data)
    if (e.share_goods_id) {
      this.data.share_goods_id = e.share_goods_id
      this._showGoodsDetailPOP(e.share_goods_id)
    }
    if (e.share_pingtuan_open_id) {
      this.data.share_pingtuan_open_id = e.share_pingtuan_open_id
    } else {
      this._showCouponPop()
    }
    // 静默式授权注册/登陆
    if (mod == 0) {
      AUTH.checkHasLogined().then(isLogin => {
        if (isLogin) {
          AUTH.bindSeller()
        } else {
          AUTH.authorize().then(res => {
            AUTH.bindSeller()
          })
        }
      })
    }
    // 设置标题
    const mallName = wx.getStorageSync('mallName')
    if (mallName) {
      this.setData({
        mallName
      })
    }
    APP.configLoadOK = () => {
      const mallName = wx.getStorageSync('mallName')
      if (mallName) {
        wx.setNavigationBarTitle({
          title: mallName
        })
      }
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
    this.noticeLastOne()
    this.getshopInfo()
    this.banners()
  },
  onShow: function(){
    this.shippingCarInfo()
    const refreshIndex = wx.getStorageSync('refreshIndex')
    if (refreshIndex) {
      this.getshopInfo()
      wx.removeStorageSync('refreshIndex')
    }
  },
  async cyTableToken(tableId, key) {
    const res = await WXAPI.cyTableToken(tableId, key)
    if (res.code != 0) {
      wx.showModal({
        confirmText: this.data.$t.common.confirm,
        cancelText: this.data.$t.common.cancel,
        content: res.msg,
        showCancel: false
      })
      return
    }
    wx.hideTabBar()
    wx.setStorageSync('uid', res.data.uid)
    wx.setStorageSync('token', res.data.token)
  },
  async getshopInfo(){
    let shopInfo = wx.getStorageSync('shopInfo')
    if (shopInfo) {
      this.setData({
        shopInfo: shopInfo,
        shopIsOpened: this.checkIsOpened(shopInfo.openingHours)
      })
      this.categories()
      return
    }
    wx.getLocation({
      type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        // console.log(res)
        this.data.latitude = res.latitude
        this.data.longitude = res.longitude
        this.fetchShops(res.latitude, res.longitude, '')
      },      
      fail: (e) => {
        console.log(e);
        if (e.errMsg.indexOf('fail auth deny') != -1) {
          AUTH.checkAndAuthorize('scope.userLocation')
        } else if (e.errMsg.indexOf('fail privacy permission is not authorized') != -1) {
          wx.showModal({
            confirmText: this.data.$t.common.confirm,
            cancelText: this.data.$t.common.cancel,
            content: this.data.$t.common.privacyPermission,
            showCancel: false,
            success: () => {
              wx.reLaunch({
                url: '/pages/index/index',
              })
            }
          })
        } else {
          wx.showModal({
            confirmText: this.data.$t.common.confirm,
            cancelText: this.data.$t.common.cancel,
            content: e.errMsg,
            showCancel: false
          })
        }
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
    if (res.code != 0) {
      wx.showModal({
        content: this.data.$t.common.empty,
        confirmText: this.data.$t.common.confirm,
        cancelText: this.data.$t.common.cancel,
        showCancel: false
      })
      return
    }
    res.data.forEach(ele => {
      ele.distance = ele.distance.toFixed(1) // 距离保留3位小数
    })
    this.setData({
      shopInfo: res.data[0],
      shopIsOpened: this.checkIsOpened(res.data[0].openingHours)
    })
    wx.setStorageSync('shopInfo', res.data[0])
    this.categories()
  },
  async _showCouponPop() {
    const a = wx.getStorageSync('has_pop_coupons')
    if (a) {
      return
    }
    // 检测是否需要弹出优惠券的福袋
    const res = await WXAPI.coupons({
      token: wx.getStorageSync('token')
    })
    if (res.code == 0) {
      this.data.showCouponPop = true
      wx.setStorageSync('has_pop_coupons', true)
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
    const shopInfo = wx.getStorageSync('shopInfo')
    const shop_goods_split = wx.getStorageSync('shop_goods_split')
    let shopId = '0'
    if (shopInfo) {
      shopId = '0,' + shopInfo.id
    }
    if (shop_goods_split != '1') {
      shopId = ''
    }
    // https://www.yuque.com/apifm/nu0f75/racmle
    const res = await WXAPI.goodsCategoryV2(shopId)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }    
    this.setData({
      page: 1,
      categories: res.data,
      categorySelected: res.data[0]
    })
    if (shop_goods_split == '1') {
      wx.setStorageSync('shopIds', res.data[0].id)
    } else {
      wx.removeStorageSync('shopIds')
    }
    this.data.page = 1
    this.getGoodsList()
  },
  async getGoodsList() {
    wx.showLoading({
      title: '',
    })
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.goodsv2({
      page: this.data.page,
      categoryId: this.data.categorySelected.id,
      pageSize: 10000
    })
    wx.hideLoading()
    if (res.code == 700) {
      if (this.data.page == 1) {
        this.setData({
          goods: null
        })
      }
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    res.data.result.forEach(ele => {
      if (ele.miaosha) {
        // 秒杀商品，显示倒计时
        const _now = new Date().getTime()
        ele.dateStartInt = new Date(ele.dateStart.replace(/-/g, '/')).getTime() - _now
        ele.dateEndInt = new Date(ele.dateEnd.replace(/-/g, '/')).getTime() -_now
      }
    })
    if (this.data.page == 1) {
      this.setData({
        goods: res.data.result
      })
    } else {
      this.setData({
        goods: this.data.goods.concat(res.data.result)
      })
    }
    this.processBadge()
  },
  _onReachBottom() {
    this.data.page++
    this.getGoodsList()
  },
  categoryClick(e) {
    const index = e.currentTarget.dataset.idx
    const categorySelected = this.data.categories[index]
    this.setData({
      page: 1,
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
    this.processBadge()
  },
  showCartPop() {
    if (this.data.scanDining) {
      // 扫码点餐，前往购物车页面
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    } else {
      this.setData({
        showCartPop: !this.data.showCartPop
      })
    }
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
    let number = item.minBuyNumber // 加入购物车的数量
    if (this.data.shippingCarInfo && this.data.shippingCarInfo.items) {
      const goods = this.data.shippingCarInfo.items.find(ele => { return ele.goodsId == item.id})
      console.log(goods);
      if (goods) {
        number = 1
      }
    }
    const res = await WXAPI.shippingCarInfoAddItem(token, item.id, number, [])
    wx.hideLoading()
    if (res.code == 2000) {
      AUTH.login(this)
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
    this.calculateGoodsPrice()
  },
  async calculateGoodsPrice() {
    const curGoodsMap = this.data.curGoodsMap
    // 计算最终的商品价格
    let price = curGoodsMap.basicInfo.minPrice
    let originalPrice = curGoodsMap.basicInfo.originalPrice
    let totalScoreToPay = curGoodsMap.basicInfo.minScore
    let buyNumMax = curGoodsMap.basicInfo.stores
    let buyNumber = curGoodsMap.basicInfo.minBuyNumber
    if (this.data.shopType == 'toPingtuan') {
      price = curGoodsMap.basicInfo.pingtuanPrice
    }
    // 计算 sku 价格
    const canSubmit = this.skuCanSubmit()
    if (canSubmit) {
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
        price = res.data.price
        if (this.data.shopType == 'toPingtuan') {
          price = res.data.pingtuanPrice
        }
        originalPrice = res.data.originalPrice
        totalScoreToPay = res.data.score
        buyNumMax = res.data.stores
      }
    }
    // 计算时段定价的价格
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (a) {
        const b = a.items.find(ele => ele.active)
        if (b) {
          price = b.price
          buyNumMax = b.stores
        }
      }
    }
    // 计算配件价格
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach(big => {
        big.items.forEach(small => {
          if (small.active) {
            price = (price*100 + small.price*100) / 100
          }
        })
      })
    }
    curGoodsMap.price = price
    this.setData({
      curGoodsMap,
      buyNumMax
    });
  },
  async skuClick2(e) {
    const propertyindex = e.currentTarget.dataset.idx1
    const propertychildindex = e.currentTarget.dataset.idx2

    const goodsAddition = this.data.goodsAddition
    const property = goodsAddition[propertyindex]
    const child = property.items[propertychildindex]
    if (child.active) {
      // 该操作为取消选择
      child.active = false
      this.setData({
        goodsAddition
      })
      this.calculateGoodsPrice()
      return
    }
    // 单选配件取消所有子栏目选中状态
    if (property.type == 0) {
      property.items.forEach(child => {
        child.active = false
      })
    }
    // 设置当前选中状态
    child.active = true
    this.setData({
      goodsAddition
    })
    this.calculateGoodsPrice()
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
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (!a) {
        canSubmit = false
      } else {
        const b = a.items.find(ele => ele.active)
        if (!b) {
          canSubmit = false
        }
      }
    }
    return canSubmit
  },
  additionCanSubmit() {
    const curGoodsMap = this.data.curGoodsMap
    let canSubmit = true
    if (curGoodsMap.basicInfo.hasAddition) {
      this.data.goodsAddition.forEach(ele => {
        if (ele.required) {
          const a = ele.items.find(item => {return item.active})
          if (!a) {
            canSubmit = false
          }
        }
      })
    }
    return canSubmit
  },
  async addCart2() {
    const token = wx.getStorageSync('token')
    const curGoodsMap = this.data.curGoodsMap
    const canSubmit = this.skuCanSubmit()
    const additionCanSubmit = this.additionCanSubmit()
    if (!canSubmit || !additionCanSubmit) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectSku,
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
    const goodsAddition = []
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach(ele => {
        ele.items.forEach(item => {
          if (item.active) {
            goodsAddition.push({
              id: item.id,
              pid: item.pid
            })
          }
        })
      })
    }
    wx.showLoading({
      title: '',
    })
    const d = {
      token,
      goodsId: curGoodsMap.basicInfo.id,
      number: curGoodsMap.number,
      sku: sku && sku.length > 0 ? JSON.stringify(sku) : '',
      addition: goodsAddition && goodsAddition.length > 0 ? JSON.stringify(goodsAddition) : '',
    }
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (a) {
        const b = a.items.find(ele => ele.active)
        if (b) {
          d.goodsTimesDay = a.day
          d.goodsTimesItem = b.name
        }
      }
    }
    const res = await WXAPI.shippingCarInfoAddItemV2(d)
    wx.hideLoading()
    if (res.code == 2000) {
      this.hideGoodsDetailPOP()
      AUTH.login(this)
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
      if (res.code == 700) {
        this.setData({
          shippingCarInfo: null,
          showCartPop: false
        })
      } else if (res.code == 0) {
        this.setData({
          shippingCarInfo: res.data
        })
      } else {
        this.setData({
          shippingCarInfo: null,
          showCartPop: false
        })
      }
      this.processBadge()
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
    this.goodsAddition(goodsId)
    this._goodsTimesSchedule(goodsId)
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
        wx.showToast({
          title: this.data.$t.index.pingtuanNoOpen,
          icon: 'none'
        })
        return
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
            AUTH.login(this)
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
    if (!this.data.scanDining) {
      wx.showTabBar()
    }
  },
  goPay() {
    if (this.data.scanDining) {
      // 扫码点餐，前往购物车
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    } else {
      wx.navigateTo({
        url: '/pages/pay/index',
      })
    }
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
    if (!openingHours) {
      return true
    }
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

    if (a[0]*1 > b[0]*1) {
      // 说明是到第二天
      return !this.checkIsOpened(endTime + '-' + startTime)
    }
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
    const additionCanSubmit = this.additionCanSubmit()
    if (!canSubmit || !additionCanSubmit) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectSku,
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
          optionValueId: small.id,
          optionName: big.name,
          optionValueName: small.name
        })
      })
    }
    const additions = []
    if (curGoodsMap.basicInfo.hasAddition) {
      this.data.goodsAddition.forEach(ele => {
        ele.items.forEach(item => {
          if (item.active) {
            additions.push({
              id: item.id,
              pid: item.pid,
              pname: ele.name,
              name: item.name
            })
          }
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
      sku,
      additions
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
  },
  async goodsAddition(goodsId){
    const res = await WXAPI.goodsAddition(goodsId)
    if (res.code == 0) {
      this.setData({
        goodsAddition: res.data
      })
    } else {
      this.setData({
        goodsAddition: null
      })
    }
  },
  tabbarChange(e) {
    if (e.detail == 1) {
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    }
    if (e.detail == 2) {
      wx.navigateTo({
        url: '/pages/cart/order',
      })
    }
  },
  // 显示分类和商品数量徽章
  processBadge() {
    const categories = this.data.categories
    const goods = this.data.goods
    const shippingCarInfo = this.data.shippingCarInfo
    if (!categories) {
      return
    }
    if (!goods) {
      return
    }
    categories.forEach(ele => {
      ele.badge = 0
    })
    goods.forEach(ele => {
      ele.badge = 0
    })
    if (shippingCarInfo) {
      shippingCarInfo.items.forEach(ele => {
        if (ele.categoryId) {
          const category = categories.find(a => {
            return a.id == ele.categoryId
          })
          if (category) {
            category.badge += ele.number
          }
        }
        if (ele.goodsId) {
          const _goods = goods.find(a => {
            return a.id == ele.goodsId
          })
          if (_goods) {
            _goods.badge += ele.number
          }
        }
      })
    }
    this.setData({
      categories,
      goods
    })
  },
  selectshop() {
    wx.navigateTo({
      url: '/pages/shop/select?type=index',
    })
  },
  goGoodsDetail(e) {
    const index = e.currentTarget.dataset.idx
    const goodsId = this.data.goods[index].id
    wx.navigateTo({
      url: '/pages/goods-details/index?id=' + goodsId,
    })
  },
  async _goodsTimesSchedule(goodsId) {
    const res = await WXAPI.goodsTimesSchedule(goodsId, '') // todo sku
    if (res.code == 0) {
      const goodsTimesSchedule = res.data
      res.data.forEach(ele => {
        ele.active = false
      })
      goodsTimesSchedule[0].active = true
      goodsTimesSchedule[0].items[0].active = true
      this.setData({
        goodsTimesSchedule
      })
      this.calculateGoodsPrice()
    } else {
      this.setData({
        goodsTimesSchedule: null
      })
    }
  },
  async skuClick3(e) {
    const propertyindex = e.currentTarget.dataset.idx1
    const propertychildindex = e.currentTarget.dataset.idx2

    const goodsTimesSchedule = this.data.goodsTimesSchedule
    const property = goodsTimesSchedule[propertyindex]
    const child = property.items[propertychildindex]
    if (child.stores <= 0) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noStores,
        icon: 'none'
      })
      return
    }
    goodsTimesSchedule.forEach(a => {
      a.active = false
      a.items.forEach(b => {
        b.active = false
      })
    })
    property.active = true
    child.active = true
    this.setData({
      goodsTimesSchedule
    })
    this.calculateGoodsPrice()
  },
  changeLang() {
    getApp().changeLang(this)
  },
})
