const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
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
    curCouponShowText: '', // 当前选择使用的优惠券
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
    packaging_fee_use: '1', // 自提需要包装费
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
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.pay.title,
    })
    let _data = {
      kjId: e.kjId,
      create_order_select_time: wx.getStorageSync('create_order_select_time'),
      packaging_fee: wx.getStorageSync('packaging_fee'),
      curCouponShowText: this.data.$t.pay.choose
    }
    if (e.orderType) {
      _data.orderType = e.orderType
    }
    if (e.pingtuanOpenId) {
      _data.pingtuanOpenId = e.pingtuanOpenId
    }
    this.setData(_data)
    this.getUserApiInfo()
    this._peisonFeeList()
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
        title: this.data.$t.pay.inputphoneNO,
        icon: 'none'
      })
      return
    }
    if (!this.data.diningTime && this.data.create_order_select_time == '1') {
      wx.showToast({
        title: this.data.$t.pay.select,
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
          title: this.data.$t.pay.address,
          icon: 'none'
        })
        return
      }
      this.createOrder(true)
    }
  },
  async createOrder(e) {
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
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.pay.servicesclosed,
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
      if (this.data.packaging_fee && this.data.packaging_fee_use == '1') {
        postData.trips = this.data.packaging_fee
      }
    }
    if (this.data.create_order_select_time == '1') {
      if (postData.peisongType == 'zq') {
        extJsonStr['取餐时间'] = this.data.diningTime
      } else {
        extJsonStr['送达时间'] = this.data.diningTime
      }
    }
    postData.extJsonStr = JSON.stringify(extJsonStr)
    // 有设置了配送费的情况下，计算运费
    if (this.data.peisonFeeList && postData.peisongType == 'kd') {
      let distance = await this.getDistance(this.data.curAddressData)
      const peisonFee = this.data.peisonFeeList.find(ele => {
        return ele.distance >= distance
      })
      if (peisonFee) {
        postData.peisongFeeId = peisonFee.id
      }
    }
    // 达达配送
    if (this.data.shopInfo && this.data.shopInfo.number && this.data.shopInfo.expressType == 'dada' && postData.peisongType == 'kd') {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: this.data.$t.pay.setaddress,
          icon: 'none'
        })
        return;
      }
      postData.dadaShopNo = this.data.shopInfo.number
      postData.lat = this.data.curAddressData.latitude
      postData.lng = this.data.curAddressData.longitude
    }
    if (e && postData.peisongType == 'kd') {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: this.data.$t.pay.Receivingaddress,
          icon: 'none'
        })
        return;
      }
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
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
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
              ele.nameExt = ele.name + + ' ['+ that.data.$t.pay.Fullconsumption +'' + ele.moneyHreshold + that.data.$t.pay.RMBreduced + ele.money + moneyUnit +']'
            } else {
              ele.nameExt = ele.name + ' ['+ that.data.$t.pay.Fullconsumption +'' + ele.money + moneyUnit + ']'
            }
          })
        }
        that.setData({
          totalScoreToPay: res.data.score,
          allGoodsNumber: res.data.goodsNumber,
          allGoodsPrice: res.data.amountTotle,
          allGoodsAndYunPrice: res.data.amountLogistics + res.data.amountTotle,
          yunPrice: res.data.amountLogistics,
          peisongfee: res.data.peisongfee,
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
    const token = wx.getStorageSync('token')
    if (res.data.status != 0) {
      // 待支付状态才需要支付
      wx.redirectTo({
        url: "/pages/all-orders/index"
      })
      return
    }
    // 直接弹出支付，取消支付的话，去订单列表
    const res1 = await WXAPI.userAmount(token)
    if (res1.code != 0) {
      wx.showToast({
        title: this.data.$t.pay.information,
        icon: 'none'
      })
      wx.redirectTo({
        url: "/pages/all-orders/index"
      });
      return
    }
    const money = res.data.amountReal * 1 - res1.data.balance*1
    if (money <= 0) {
      // 使用余额支付
      await WXAPI.orderPay(token, res.data.id)
      // 跳到订单列表
      wx.redirectTo({
        url: "/pages/all-orders/index"
      })
    } else {
      this.setData({
        paymentShow: true,
        money,
        orderId: res.data.id,
        nextAction: {
          type: 0,
          id: res.data.id
        }
      })
    }
  },
  paymentOk(e) {
    console.log(e.detail); // 这里是组件里data的数据
    this.setData({
      paymentShow: false
    })
    wx.redirectTo({
      url: '/pages/all-orders/index',
    })
  },
  paymentCancel() {
    this.setData({
      paymentShow: false
    })
  },
  async getDistance(curAddressData) {
    // 计算门店与收货地址之间的距离
    if (!this.data.shopInfo || !this.data.shopInfo.latitude || !this.data.shopInfo.longitude || !curAddressData || !curAddressData.latitude || !curAddressData.longitude) {
      return 0
    }
    let distance = 0
    const QQ_MAP_KEY = wx.getStorageSync('QQ_MAP_KEY')
    if (QQ_MAP_KEY == '1') {
      const distanceRes = await WXAPI.gpsDistance({
        key: QQ_MAP_KEY,
        mode: 'bicycling',
        from: this.data.shopInfo.latitude + ',' + this.data.shopInfo.longitude,
        to: curAddressData.latitude + ',' + curAddressData.longitude
      })
      if (distanceRes.code != 0) {
        wx.showToast({
          title: distanceRes.msg,
          icon: 'none'
        })
        return distance
      }
      distance = distanceRes.data.result.rows[0].elements[0].distance / 1000.0
      return distance
    }
    // 只能计算直线距离
    return this.getDistanceLine(this.data.shopInfo.latitude, this.data.shopInfo.longitude, curAddressData.latitude, curAddressData.longitude) / 1000
  },
  getDistanceLine(lat1, lng1, lat2, lng2) {
    var dis = 0;
    var radLat1 = toRadians(lat1);
    var radLat2 = toRadians(lat2);
    var deltaLat = radLat1 - radLat2;
    var deltaLng = toRadians(lng1) - toRadians(lng2);
    var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137;
  
    function toRadians(d) {
      return d * Math.PI / 180;
    }
  },
  async initShippingAddress() {
    const res = await WXAPI.defaultAddress(wx.getStorageSync('token'))
    if (res.code == 0) {
      // 计算距离
      let distance = await this.getDistance(res.data.info)
      console.log('distance', distance);
      if (this.data.shopInfo.serviceDistance && distance > this.data.shopInfo.serviceDistance * 1 && this.data.peisongType == 'kd') {
        wx.showToast({
          title: this.data.$t.pay.address,
          icon: 'none'
        })
      }
      this.setData({
        curAddressData: res.data.info,
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
      if (carShopBean.stores < carShopBean.minBuyNumber) {
        continue
      }
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
      _goodsJsonStr.goodsTimesDay = carShopBean.goodsTimesDay || ''
      _goodsJsonStr.goodsTimesItem = carShopBean.goodsTimesItem || ''
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
        title: this.data.$t.pay.login,
        icon: 'none'
      })
      return
    }
    if (res.code == 0) {
      wx.showToast({
        title: this.data.$t.pay.fetchsuccessful,
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
      desc: this.data.$t.pay.memberinformation,
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
      title: this.data.$t.pay.Loginsuccessful,
    })
    this.getUserApiInfo()
  },
  async _peisonFeeList() {
    // https://www.yuque.com/apifm/nu0f75/nx465k
    const res = await WXAPI.peisonFeeList()
    if (res.code == 0) {
      this.data.peisonFeeList = res.data
    }
  },
  packaging_fee_Change(event) {
    this.setData({
      packaging_fee_use: event.detail,
    })
    this.createOrder()
  },
  packaging_fee_Click(event) {
    const { name } = event.currentTarget.dataset;
    this.setData({
      packaging_fee_use: name,
    })
    this.createOrder()
  },
})