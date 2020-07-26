//index.js
//获取应用实例
const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const SelectSizePrefix = "选择："

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  wx.setNavigationBarTitle({
    title: wx.getStorageSync('mallName')
  })
}

Page({
  data: {
    categories: [],
    categorySelected: {
      name: '',
      id: ''
    },
    currentGoods: [],
    onLoadStatus: true,
    scrolltop: 0,

    skuCurGoods: undefined,
    switch2Checked: true,//选择框
    switch1 : true, //switch开关

    hideShopPopup: true, //
    shopType: "tobuy", //购物类型，加入购物车或立即购买
    pingtuanSet: false,
    selectSize: SelectSizePrefix,   
    goodsNumber: 0,   
    orderNumber: 0,

  },
  // 开关
  onChange(event){
    const detail = event.detail;
    this.setData({
        'switch1' : detail.value
    })    
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    // 
    wx.showShareMenu({
      withShareTicket: true
    })  
      
    this.categories()
    this.getshopInfo() //获取店铺信息 选择店铺的在onshow里    
    
  },
  onShow: function(){   
    this.setData({ //刷新选择的店铺
      shopInfo: wx.getStorageSync('shopInfo')
    })

  },
  // 
  getshopInfo: function(){
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
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  //   
  async fetchShops(latitude, longitude, kw){
    const res = await WXAPI.fetchShops({
      curlatitude: latitude,
      curlongitude: longitude,
      nameLike: kw
    })
    if (res.code == 0) {
      res.data.forEach(ele => {
        ele.distance = ele.distance.toFixed(1) // 距离保留3位小数
      })
      
      this.setData({
        shops: res.data
      })
    } else {
      this.setData({
        shops: null
      })
    }
    // 最近门店
    // console.log(res.data)
    var shopInfo = this.data.shops[0]   
    this.setData({
      shopInfo: shopInfo,
    })
        
  },
  // 获取分类
  async categories() {
    wx.showLoading({
      title: '加载中',
    })
    const res = await WXAPI.goodsCategory()
    wx.hideLoading()
    let categories = [];
    let categoryName = '';
    let categoryId = '';
    if (res.code == 0) {
      if (this.data.categorySelected.id) {
        const _curCategory = res.data.find(ele => {
          return ele.id == this.data.categorySelected.id
        })
        categoryName = _curCategory.name;
        categoryId = _curCategory.id;
      }
      for (let i = 0; i < res.data.length; i++) {
        let item = res.data[i];
        categories.push(item);
        if (i == 0 && !this.data.categorySelected.id) {
          categoryName = item.name;
          categoryId = item.id;
        }
      }
    }
    this.setData({
      categories: categories,
      categorySelected: {
        name: categoryName,
        id: categoryId
      }
    });
    this.getGoodsList();
  },
  async getGoodsList() {
    wx.showLoading({
      title: '加载中',
    })
    const res = await WXAPI.goods({
      categoryId: this.data.categorySelected.id,
      page: 1,
      pageSize: 100000
    })
    wx.hideLoading()
    if (res.code == 700) {
      this.setData({
        currentGoods: null
      });
      return
    }
    // console.log(res.data)
    this.setData({
      currentGoods: res.data
    });   

  },
  onCategoryClick: function(e) {
    var that = this;
    var id = e.target.dataset.id;
    if (id === that.data.categorySelected.id) {
      that.setData({
        scrolltop: 0,
      })
    } else {
      var categoryName = '';
      for (var i = 0; i < that.data.categories.length; i++) {
        let item = that.data.categories[i];
        if (item.id == id) {
          categoryName = item.name;
          break;
        }
      }
      that.setData({
        categorySelected: {
          name: categoryName,
          id: id
        },
        scrolltop: 0
      });
      that.getGoodsList();
    }
  },
  // 
  async addShopCar(e) {
    const curGood = this.data.currentGoods.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })
    if (!curGood) {
      return
    }
    if (curGood.stores <= 0) {
      wx.showToast({
        title: '已售罄',
        icon: 'none'
      })
      return
    }    
    this.addShopCarCheck({      
      goodsId: curGood.id,
      buyNumber: 1,
      sku: []
    })
    
  },
  async addShopCarCheck(options){
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        // 处理加入购物车的业务逻辑
        this.addShopCarDone(options)
      }
    })
  },
  async addShopCarDone(options){
    const res = await WXAPI.shippingCarInfoAddItem(wx.getStorageSync('token'), options.goodsId, options.buyNumber, options.sku)
    if (res.code == 30002) {
      // 需要选择规格尺寸
      const skuCurGoodsRes = await WXAPI.goodsDetail(options.goodsId)      
      if (skuCurGoodsRes.code != 0) {
        wx.showToast({
          title: skuCurGoodsRes.msg,
          icon: 'none'
        })
        return
      }
      wx.hideTabBar()
      const skuCurGoods = skuCurGoodsRes.data
      var pingtuan = skuCurGoods.basicInfo.pingtuan
      skuCurGoods.basicInfo.storesBuy = 1
      this.setData({
        pingtuan,
        skuCurGoods,
      })
      // console.log(skuCurGoods)
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '加入成功',
      icon: 'success'
    })
    this.setData({
      skuCurGoods: null
    })
    wx.showTabBar()
    TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
  },
  storesJia(){
    const skuCurGoods = this.data.skuCurGoods
    if (skuCurGoods.basicInfo.storesBuy < skuCurGoods.basicInfo.stores) {
      skuCurGoods.basicInfo.storesBuy++
      this.setData({
        skuCurGoods
      })
    }
  },
  storesJian(){
    const skuCurGoods = this.data.skuCurGoods
    if (skuCurGoods.basicInfo.storesBuy > 1) {
      skuCurGoods.basicInfo.storesBuy--
      this.setData({
        skuCurGoods
      })
    }
  },
  closeSku(){
    this.setData({
      skuCurGoods: null
    })
    wx.showTabBar()
  },
  skuSelect(e){
    const pid = e.currentTarget.dataset.pid
    const id = e.currentTarget.dataset.id
    // 处理选中
    const skuCurGoods = this.data.skuCurGoods
    const property = skuCurGoods.properties.find(ele => {return ele.id == pid})
    property.childsCurGoods.forEach(ele => {
      if (ele.id == id) {
        ele.active = true
      } else {
        ele.active = false
      }
    })
    this.setData({
      skuCurGoods
    })
    
  },
  async addCarSku(){     
    var skuCurGoods = this.data.skuCurGoods     
    var propertySize = skuCurGoods.properties.length // 有几组SKU     
    var sku = []
    skuCurGoods.properties.forEach(p => {
      const o = p.childsCurGoods.find(ele => {return ele.active})
      if (!o) {        
        return
      }
      sku.push({
        optionId: o.propertyId,
        optionValueId: o.id
      })
    })
    if (sku.length != propertySize) {
      wx.showToast({
        title: '请选择甜度、口感等',
        icon: 'none'
      })
      return
    }
    var pingtuan = skuCurGoods.basicInfo.pingtuan
    // console.log(pingtuan)    
    var options = {
      goodsId: skuCurGoods.basicInfo.id,
      buyNumber: skuCurGoods.basicInfo.storesBuy,
      sku//规格
    }    
    // console.log(skuCurGoods)
    // console.log(properties)
    // console.log(sku)
    // console.log(options.buyNumber)
    let propertyChildIds = "";
    let propertyChildNames = "";
    var properties = skuCurGoods.properties //
    sku.forEach(p=>{
      var optionValueId = p.optionValueId
      // console.log(optionValueId)
      properties.forEach(c=>{
        var childsCurGoods = c.childsCurGoods
        childsCurGoods.forEach(d=>{
          var id = d.id
          var name = d.name          
          if(optionValueId == id){
            propertyChildIds = propertyChildIds + p.optionId + ":" + p.optionValueId + ",";
            propertyChildNames = propertyChildNames + c.name + ":" + name + "  ";
          }
        })        
      })
    })

    this.setData({
      propertyChildIds,
      propertyChildNames,
    })
    // console.log(propertyChildIds)
    // console.log(propertyChildNames)
    const res = await WXAPI.goodsPrice(options.goodsId, propertyChildIds)
    // console.log(res.data)
    if (res.code == 0) {
      let _price = res.data.price
      if (pingtuan) {
        this.closeSku()
        _price = res.data.pingtuanPrice        
        this.getGoodsDetailAndKanjieInfo(options.goodsId)
        // console.log(res.data.originalPrice)
        this.setData({
          pingtuanSet: true,// 
          selectSizePrice: _price,
          selectSizeOPrice: res.data.originalPrice,//SizeO,大写的字母O
          totalScoreToPay: res.data.score,
          propertyChildIds: propertyChildIds,
          propertyChildNames: propertyChildNames,
          buyNumMax: res.data.stores,
          buyNumber: (res.data.stores > 0) ? 1 : 0
        })
      } else {      
        this.setData({
          options,
        })
        this.addShopCarDone(options)
      }       
    }    
    
  },
  //   
  ptClose: function(){
    this.setData({
      pingtuanSet: false,
    })
  },
  // 获取商品详情
  async getGoodsDetailAndKanjieInfo(goodsId) {
    const that = this;
    const goodsDetailRes = await WXAPI.goodsDetail(goodsId)
    const goodsKanjiaSetRes = await WXAPI.kanjiaSet(goodsId)
    if (goodsDetailRes.code == 0) {
      var selectSizeTemp = SelectSizePrefix;
      if (goodsDetailRes.data.properties) {
        for (var i = 0; i < goodsDetailRes.data.properties.length; i++) {
          selectSizeTemp = selectSizeTemp + " " + goodsDetailRes.data.properties[i].name;
        }
        that.setData({
          goodsName: goodsDetailRes.data.basicInfo.name,
          goodsPic: goodsDetailRes.data.basicInfo.pic,
          hasMoreSelect: true,
          selectSize: selectSizeTemp,
          // selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
          // selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
          totalScoreToPay: goodsDetailRes.data.basicInfo.minScore
        });
      }
      if (goodsDetailRes.data.basicInfo.shopId) {
        this.shopSubdetail(goodsDetailRes.data.basicInfo.shopId)
      }      
      that.data.goodsDetail = goodsDetailRes.data;
      if (goodsDetailRes.data.basicInfo.videoId) {
        that.getVideoSrc(goodsDetailRes.data.basicInfo.videoId);
      }
      // console.log(goodsDetailRes.data)
      let _data = {
        goodsDetail: goodsDetailRes.data,
        // selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
        // selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,        
        totalScoreToPay: goodsDetailRes.data.basicInfo.minScore,
        buyNumMax: goodsDetailRes.data.basicInfo.stores,
        buyNumber: (goodsDetailRes.data.basicInfo.stores > 0) ? 1 : 0,
        
      }
      if (goodsKanjiaSetRes.code == 0) {
        _data.curGoodsKanjia = goodsKanjiaSetRes.data[0]
        that.data.kjId = _data.curGoodsKanjia.id
        // 获取当前砍价进度
        if (!that.data.kjJoinUid) {
          that.data.kjJoinUid = wx.getStorageSync('uid')
        }
        const curKanjiaprogress = await WXAPI.kanjiaDetail(_data.curGoodsKanjia.id, that.data.kjJoinUid)
        const myHelpDetail = await WXAPI.kanjiaHelpDetail(wx.getStorageSync('token'), _data.curGoodsKanjia.id, that.data.kjJoinUid)
        if (curKanjiaprogress.code == 0) {
          _data.curKanjiaprogress = curKanjiaprogress.data
        }
        if (myHelpDetail.code == 0) {
          _data.myHelpDetail = myHelpDetail.data
        }
      }      
      
      if (goodsDetailRes.data.basicInfo.pingtuan) {   
        that.pingtuanList(goodsId)   
        var pingtuanSetRes = await WXAPI.pingtuanSet(goodsId)
        // console.log(pingtuanSetRes)
        // _data.numberPerson = pingtuansetRes.data.numberPerson   
        if (pingtuanSetRes.code == 0){          
          var pingtuanSetInfo  = pingtuanSetRes.data               
          this.setData({
            pingtuanSetInfo,            
          })
          // console.log(pingtuanSetInfo)
        }    
            
      }
      that.setData(_data);      
    }

  }, 
  // 
  pingtuanList: function(goodsId) {
    var that= this    
    WXAPI.pingtuanList({
      goodsId: goodsId,
      status: 0
    }).then(function(res) {
      if (res.code == 0) {
        var pingtuanList = res.data.result[0] //数组第一个，
        var goodsNumber = pingtuanList.goodsNumber
        var orderNumber = pingtuanList.orderNumber        
               
        that.setData({
          pingtuanList,   
          goodsNumber,
          orderNumber,          

        });
        // console.log(pingtuanList)        
      }
    })
  },       
  // 立即购买 去拼单
  buyNow: function(e) {   
    var that = this   
    let shoptype = that.data.shopType 
    // let shoptype = e.currentTarget.dataset.shoptype //获取shoptype
    // let pingtuanopenid = e.currentTarget.dataset.pingtuanopenid //获取拼团id
    console.log(shoptype)
    // console.log(this.data.pingtuanopenid)    
    //组建立即购买信息
    var buyNowInfo = this.buliduBuyNowInfo(shoptype);
    // 写入本地存储
    wx.setStorage({
      key: "buyNowInfo",
      data: buyNowInfo
    })
    this.ptClose(); //关闭弹窗
    if (shoptype == 'toPingtuan') {
      if (this.data.pingtuanopenid) {
        // wx.navigateTo({
        //   url: "/pages/to-pay-order/index?orderType=buyNow&pingtuanOpenId=" + this.data.pingtuanopenid
        // })
        wx.navigateTo({
          url: "/pages/pay/index?orderType=buyNow&pingtuanOpenId=" + this.data.pingtuanopenid
        })
      } else {
        WXAPI.pingtuanOpen(wx.getStorageSync('token'), that.data.goodsDetail.basicInfo.id).then(function(res) {
          if (res.code == 2000) {
            that.setData({
              wxlogin: false
            })
            return
          }
          if (res.code != 0) {
            wx.showToast({
              title: res.msg,
              icon: 'none',
              duration: 2000
            })
            return
          }
          // wx.navigateTo({
          //   url: "/pages/to-pay-order/index?orderType=buyNow&pingtuanOpenId=" + res.data.id
          // })
          wx.navigateTo({
            url: "/pages/pay/index?orderType=buyNow&pingtuanOpenId=" + res.data.id
          })
        })
      }
    } else {
      // wx.navigateTo({
      //   url: "/pages/to-pay-order/index?orderType=buyNow"
      // })
      wx.navigateTo({
        url: "/pages/pay/index?orderType=buyNow"
      })
    }

  },
  // 组建立即购买信息   
  buliduBuyNowInfo: function(shoptype) {    
    var shopCarMap = {};
    shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id; 
    shopCarMap.pic = this.data.goodsDetail.basicInfo.pic; 
    shopCarMap.name = this.data.goodsDetail.basicInfo.name; 
        
    shopCarMap.propertyChildIds = this.data.propertyChildIds; 
    shopCarMap.label = this.data.propertyChildNames;    
     
    shopCarMap.price = this.data.selectSizePrice;    
    shopCarMap.score = this.data.totalScoreToPay;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;
    shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
    shopCarMap.logistics = this.data.goodsDetail.logistics;
    shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

    // console.log()
    // console.log(shopCarMap.propertyChildIds)
    // console.log(shopCarMap.label)  
    // console.log(shopCarMap.price)
    // console.log(shopCarMap.number)
    // console.log(shopCarMap.logisticsType)
    // console.log(shopCarMap.logistics)

    var buyNowInfo = {};
    buyNowInfo.shopNum = 0;
    buyNowInfo.shopList = [];    
    buyNowInfo.shopList.push(shopCarMap);  
    buyNowInfo.kjId = this.data.kjId;    
    return buyNowInfo;
  },
  // 单独购买  
  toBuy: function() {
    // var selectSizePrice = this.data.goodsDetail.basicInfo.minPrice
    var selectSizePrice = this.data.selectSizeOPrice
    this.setData({
      shopType: "tobuy",
      selectSizePrice: selectSizePrice,
    });
    // console.log(selectSizePrice)
    this.buyNow()
  },
  // 发起拼团
  toPintuan: function(){
    this.setData({
      shopType: "toPingtuan",
    })
    this.buyNow()
  }
  
  


})
