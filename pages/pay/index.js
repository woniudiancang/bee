const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const wxpay = require('../../utils/pay.js')
const CONFIG = require('../../config.js')
const APP = getApp()
APP.configLoadOK = () => {

}

Page({
  data: {
    wxlogin: true,
    switch1 : true, //switch开关

    addressList: [],
    curAddressData: [],

    totalScoreToPay: 0,
    goodsList: [],
    allGoodsPrice: 0,
    amountReal: 0,
    yunPrice: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，
    pingtuanOpenId: undefined, //拼团的话记录团号
    
    curCoupon: null, // 当前选择使用的优惠券
    curCouponShowText: '请选择使用优惠券', // 当前选择使用的优惠券
    peisongType: '', // 配送方式 kd,zq 分别表示快递/到店自取【默认值到onshow修改，这里修改无效】
    submitLoding: false,
    remark: '',

    currentDate: new Date().getHours() + ':' + (new Date().getMinutes() % 10 === 0 ? new Date().getMinutes() : Math.ceil(new Date().getMinutes() / 10) * 10),
    minHour: new Date().getHours(),
    minMinute: new Date().getMinutes(),
    formatter(type, value) {
      if (type === 'hour') {
        return `${value}点`;
      } else if (type === 'minute') {
        return `${value}分`;
      }
      return value;
    },
    filter(type, options) {
      if (type === 'minute') {
        return options.filter((option) => option % 10 === 0);
      }
      return options;
    },
  },
  diningTimeChange(a) {
    const selectedHour = a.detail.getColumnValue(0).replace('点', '') * 1
    if (selectedHour == new Date().getHours()) {
      let minMinute = new Date().getMinutes()
      if (minMinute % 10 !== 0) {
        minMinute = minMinute / 10 + 1
      }
      this.setData({
        minMinute
      })
    } else {
      this.setData({
        minMinute: 0
      })
    }
  },
  onShow(){
    const shopInfo = wx.getStorageSync('shopInfo')
    let peisongType = wx.getStorageSync('peisongType')
    if (!peisongType) {
      peisongType = 'zq' // 此处修改默认值
    }
    if (shopInfo.openWaimai && !shopInfo.openZiqu) {
      peisongType = 'kd'
    }
    if (!shopInfo.openWaimai && shopInfo.openZiqu) {
      peisongType = 'zq'
    }
    this.setData({
      shopInfo,
      peisongType
    })
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        this.doneShow()
      }
    })
    AUTH.wxaCode().then(code => {
      this.data.code = code
    })
  },
  async doneShow() {
    let goodsList = [];
    const token = wx.getStorageSync('token')
    //立即购买下单
    if ("buyNow" == this.data.orderType) {
      goodsList = wx.getStorageSync('pingtuanGoodsList')
    } else {
      //购物车下单
      const res = await WXAPI.shippingCarInfo(token)
      if (res.code == 0) {
        goodsList = res.data.items
      }
    }
    this.setData({
      goodsList: goodsList
    })
    this.initShippingAddress()
  },

  onLoad(e) {
    let _data = {}
    if (e.orderType) {
      _data.orderType = e.orderType
    }
    if (e.pingtuanOpenId) {
      _data.pingtuanOpenId = e.pingtuanOpenId
    }
    this.setData(_data)
    this.getUserApiInfo()
  },
  selected(e){
    const peisongType = e.currentTarget.dataset.pstype
    this.setData({
      peisongType
    })
    wx.setStorageSync('peisongType', peisongType)
    this.createOrder()
  },
  
  getDistrictId: function (obj, aaa) {
    if (!obj) {
      return "";
    }
    if (!aaa) {
      return "";
    }
    return aaa;
  },
  // 备注
  remarkChange(e){
    this.data.remark = e.detail.value
  },
  goCreateOrder(){
    if (this.data.submitLoding) return
    const mobile = this.data.mobile
    if (this.data.peisongType == 'zq' && !mobile) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      })
      return
    }
    if (!this.data.diningTime) {
      wx.showToast({
        title: '请选择自取/配送时间',
        icon: 'none'
      })
      return
    }
    this.setData({
      submitLoding: true
    })
    const subscribe_ids = wx.getStorageSync('subscribe_ids')
    if (subscribe_ids) {
      wx.requestSubscribeMessage({
        tmplIds: subscribe_ids.split(','),
        success(res) {},
        fail(e) {
          this.setData({
            submitLoding: false
          })
          console.error(e)
        },
        complete: (e) => {
          this.createOrder(true)
        },
      })
    } else {
      if (this.data.shopInfo.serviceDistance && this.data.distance && this.data.distance > this.data.shopInfo.serviceDistance * 1 && this.data.peisongType == 'kd') {
        wx.showToast({
          title: '当前地址超出配送范围',
          icon: 'none'
        })
        return
      }
      this.createOrder(true)
    }
  },
  createOrder: function (e) {
    var that = this;
    var loginToken = wx.getStorageSync('token') // 用户登录 token
    var remark = this.data.remark; // 备注信息
    const postData = {
      token: loginToken,
      goodsJsonStr: that.data.goodsJsonStr,
      remark: remark,
      peisongType: that.data.peisongType,
      isCanHx: true
    }
    if (this.data.shopInfo) {
      if (!this.data.shopInfo.openWaimai && !this.data.shopInfo.openZiqu) {
        wx.showModal({
          title: '错误',
          content: '堂食和外卖服务已关闭',
          showCancel: false
        })
        return;
      }
      postData.shopIdZt = this.data.shopInfo.id
      postData.shopNameZt = this.data.shopInfo.name
    }
    if (that.data.kjId) {
      postData.kjid = that.data.kjId
    }
    if (that.data.pingtuanOpenId) {
      postData.pingtuanOpenId = that.data.pingtuanOpenId
    }
    const extJsonStr = {}
    if (postData.peisongType == 'zq') {
      extJsonStr['联系电话'] = this.data.mobile
      extJsonStr['取餐时间'] = this.data.diningTime
    } else {
      extJsonStr['送达时间'] = this.data.diningTime
    }
    postData.extJsonStr = JSON.stringify(extJsonStr)
    if (e && postData.peisongType == 'kd') {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: '请设置收货地址',
          icon: 'none'
        })
        return;
      }
      // 达达配送
      if (this.data.shopInfo.number && this.data.shopInfo.expressType == 'dada') {
        postData.dadaShopNo = this.data.shopInfo.number
        postData.dadaLat = this.data.curAddressData.latitude
        postData.dadaLng = this.data.curAddressData.longitude
      }
      if (postData.peisongType == 'kd') {
        postData.provinceId = that.data.curAddressData.provinceId;
        postData.cityId = that.data.curAddressData.cityId;
        if (that.data.curAddressData.districtId) {
          postData.districtId = that.data.curAddressData.districtId;
        }
        postData.address = that.data.curAddressData.address;
        postData.linkMan = that.data.curAddressData.linkMan;
        postData.mobile = that.data.curAddressData.mobile;
        postData.code = that.data.curAddressData.code;
      }      
    }
    if (that.data.curCoupon) {
      postData.couponId = that.data.curCoupon.id;
    }
    if (!e) {
      postData.calculate = "true";
    }
    // console.log(postData)
    // console.log(e)
    WXAPI.orderCreate(postData)
    .then(function (res) {     
      console.log(res.data) 
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return;
      }

      if (e && "buyNow" != that.data.orderType) {
        // 清空购物车数据
        WXAPI.shippingCarInfoRemoveAll(loginToken)
      }
      if (!e) {
        const coupons = res.data.couponUserList
        if (coupons) {
          coupons.forEach(ele => {
            let moneyUnit = '元'
            if (ele.moneyType == 1) {
              moneyUnit = '%'
            }
            if (ele.moneyHreshold) {
              ele.nameExt = ele.name + ' [消费满' + ele.moneyHreshold + '元可减' + ele.money + moneyUnit +']'
            } else {
              ele.nameExt = ele.name + ' [减' + ele.money + moneyUnit + ']'
            }
          })
        }
        that.setData({
          totalScoreToPay: res.data.score,
          allGoodsNumber: res.data.goodsNumber,
          allGoodsPrice: res.data.amountTotle,
          allGoodsAndYunPrice: res.data.amountLogistics + res.data.amountTotle,
          yunPrice: res.data.amountLogistics,
          amountReal: res.data.amountReal,
          coupons
        });
        return;
      }
      return that.processAfterCreateOrder(res)
    })
    .finally(() => {
      // 再唤起微信支付的时候，有大约1s的弹窗动画过度，加上 1s 的延迟可以稳定防止重复下单
      setTimeout(() => {
        this.setData({
          submitLoding: false
        })
      }, 1000)
    })
  },
  async processAfterCreateOrder(res) {
    // 直接弹出支付，取消支付的话，去订单列表
    const res1 = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res1.code != 0) {
      wx.showToast({
        title: '无法获取用户资金信息',
        icon: 'none'
      })
      wx.redirectTo({
        url: "/pages/all-orders/index"
      });
      return
    }
    const money = res.data.amountReal * 1 - res1.data.balance*1
    if (money <= 0) {
      wx.redirectTo({
        url: "/pages/all-orders/index"
      })
    } else {
      wxpay.wxpay('order', money, res.data.id, "/pages/all-orders/index");
    }
  },
  async initShippingAddress() {
    const res = await WXAPI.defaultAddress(wx.getStorageSync('token'))
    if (res.code == 0) {
      const curAddressData = res.data.info
      // 计算距离
      let distance = 0
      if (CONFIG.baiduMapKey) {
        const distanceRes = await WXAPI.gpsDistance({
          key: CONFIG.baiduMapKey,
          mode: 'bicycling',
          from: this.data.shopInfo.latitude + ',' + this.data.shopInfo.longitude,
          to: curAddressData.latitude + ',' + curAddressData.longitude
        })
        if (distanceRes.code !== 0 && this.data.peisongType == 'kd') {
          wx.showToast({
            title: '当前地址超出配送范围',
            icon: 'none'
          })
        } else {
          distance = distanceRes.data.result.rows[0].elements[0].distance / 1000.0
          if (this.data.shopInfo.serviceDistance && distance > this.data.shopInfo.serviceDistance * 1 && this.data.peisongType == 'kd') {
            wx.showToast({
              title: '当前地址超出配送范围',
              icon: 'none'
            })
          }
        }
      }
      this.setData({
        curAddressData,
        distance
      })
    } else {
      this.setData({
        curAddressData: null
      });
    }
    this.processYunfei();
  },
  processYunfei() {
    var goodsList = this.data.goodsList
    if (goodsList.length == 0) {
      return
    }
    const goodsJsonStr = []
    var isNeedLogistics = 0;

    let inviter_id = 0;
    let inviter_id_storge = wx.getStorageSync('referrer');
    if (inviter_id_storge) {
      inviter_id = inviter_id_storge;
    }
    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      if (carShopBean.logistics || carShopBean.logisticsId) {
        isNeedLogistics = 1;
      }

      const _goodsJsonStr = {
        propertyChildIds: carShopBean.propertyChildIds
      }
      if (carShopBean.sku && carShopBean.sku.length > 0) {
        let propertyChildIds = ''
        carShopBean.sku.forEach(option => {
          propertyChildIds = propertyChildIds + ',' + option.optionId + ':' + option.optionValueId
        })
        _goodsJsonStr.propertyChildIds = propertyChildIds
      }
      if (carShopBean.additions && carShopBean.additions.length > 0) {
        let goodsAdditionList = []
        carShopBean.additions.forEach(option => {
          goodsAdditionList.push({
            pid: option.pid,
            id: option.id
          })
        })
        _goodsJsonStr.goodsAdditionList = goodsAdditionList
      }
      _goodsJsonStr.goodsId = carShopBean.goodsId
      _goodsJsonStr.number = carShopBean.number
      _goodsJsonStr.logisticsType = 0
      _goodsJsonStr.inviter_id = inviter_id
      goodsJsonStr.push(_goodsJsonStr)

    }
    this.setData({
      isNeedLogistics: isNeedLogistics,
      goodsJsonStr: JSON.stringify(goodsJsonStr)
    });
    this.createOrder()
  },
  addAddress: function () {
    wx.navigateTo({
      url: "/pages/ad/index"
    })
  },
  selectAddress: function () {
    wx.navigateTo({
      url: "/pages/ad/index"
    })
  },
  bindChangeCoupon: function (e) {
    const selIndex = e.detail.value;
    this.setData({
      curCoupon: this.data.coupons[selIndex],
      curCouponShowText: this.data.coupons[selIndex].nameExt
    })
    this.createOrder()
  },
  async getPhoneNumber(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showToast({
        title: e.detail.errMsg,
        icon: 'none'
      })
      return;
    }
    const res = await WXAPI.bindMobileWxapp(wx.getStorageSync('token'), this.data.code, e.detail.encryptedData, e.detail.iv)
    AUTH.wxaCode().then(code => {
      this.data.code = code
    })
    if (res.code === 10002) {
      wx.showToast({
        title: '请先登陆',
        icon: 'none'
      })
      return
    }
    if (res.code == 0) {
      wx.showToast({
        title: '读取成功',
        icon: 'success'
      })
      this.setData({
        mobile: res.data
      })
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        nick: res.data.base.nick,
        avatarUrl: res.data.base.avatarUrl,
        mobile: res.data.base.mobile
      })
    }
  },
  diningTimeShow() {
    this.setData({
      diningTimeShow: true
    })
  },
  diningTimeHide() {
    this.setData({
      diningTimeShow: false
    })
  },
  diningTimeConfirm(e) {
    this.setData({
      diningTime: e.detail
    })
    this.diningTimeHide()
  },
  updateUserInfo(e) {
    wx.getUserProfile({
      lang: 'zh_CN',
      desc: '用于完善会员资料',
      success: res => {
        console.log(res);
        this._updateUserInfo(res.userInfo)
      },
      fail: err => {
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  async _updateUserInfo(userInfo) {
    const postData = {
      token: wx.getStorageSync('token'),
      nick: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      city: userInfo.city,
      province: userInfo.province,
      gender: userInfo.gender,
    }
    const res = await WXAPI.modifyUserInfo(postData)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '登陆成功',
    })
    this.getUserApiInfo()
  }
})