const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    goodsDetail: {},
    hasMoreSelect: false,
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    totalScoreToPay: 0,
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
  },
  onLoad(e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.goodsDetail.title,
    })
    // e.id = 122843
    // 读取分享链接中的邀请人编号
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }
    // 读取小程序码中的邀请人编号
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    this.data.goodsId = e.id
    this.data.kjJoinUid = e.kjJoinUid
    let goodsDetailSkuShowType = wx.getStorageSync('goodsDetailSkuShowType')
    if (!goodsDetailSkuShowType) {
      goodsDetailSkuShowType = 0
    }
    // 补偿写法
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
    this.setData({
      goodsDetailSkuShowType,
      curuid: wx.getStorageSync('uid')
    })
    this.readConfigVal()
    this.getGoodsDetailAndKanjieInfo(this.data.goodsId)
    this.shippingCartInfo()
    this.goodsAddition()
  },
  readConfigVal() {

  },
  async _goodsTimesSchedule() {
    const res = await WXAPI.goodsTimesSchedule(this.data.goodsId, '') // todo sku
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
  async goodsAddition() {
    const res = await WXAPI.goodsAddition(this.data.goodsId)
    if (res.code == 0) {
      this.setData({
        goodsAddition: res.data,
        hasMoreSelect: true,
      })
    }
  },
  async shippingCartInfo() {
    const number = await TOOLS.showTabBarBadge(true)
    this.setData({
      shopNum: number
    })
  },
  onShow() {
    AUTH.checkHasLogined().then(isLogin => {
      if (isLogin) {
        AUTH.bindSeller()
      } else {
        AUTH.authorize().then(res => {
          AUTH.bindSeller()
        })
      }
    })
  },
  async getGoodsDetailAndKanjieInfo(goodsId) {
    const token = wx.getStorageSync('token')
    const that = this;
    const goodsDetailRes = await WXAPI.goodsDetail(goodsId, token ? token : '')
    const goodsKanjiaSetRes = await WXAPI.kanjiaSet(goodsId)
    if (goodsDetailRes.code == 0) {
      if (!goodsDetailRes.data.pics || goodsDetailRes.data.pics.length == 0) {
        goodsDetailRes.data.pics = [{
          pic: goodsDetailRes.data.basicInfo.pic
        }]
      }
      if (goodsDetailRes.data.properties) {
        that.setData({
          hasMoreSelect: true,
          selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
          selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
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
      let _data = {
        goodsDetail: goodsDetailRes.data,
        selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
        selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
        totalScoreToPay: goodsDetailRes.data.basicInfo.minScore,
        buyNumMax: goodsDetailRes.data.basicInfo.stores,
        buyNumber: (goodsDetailRes.data.basicInfo.stores > 0) ? 1 : 0
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
        //砍价商品 tabs栏显示砍价情况
        // var tabs = that.data.tabs
        // tabs[2].tabs_name=that.data.$t.goodsDetail.kanjiaLogs
        // tabs[2].view_id="kanjia"
        // that.setData({
        //   tabs:tabs
        // })
      }
      that.setData(_data)
      that._goodsTimesSchedule()
    }
  },
  async shopSubdetail(shopId) {
    const res = await WXAPI.shopSubdetail(shopId)
    if (res.code == 0) {
      this.setData({
        shopSubdetail: res.data
      })
    }
  },
  goShopCar: function () {
    wx.reLaunch({
      url: "/pages/shop-cart/index"
    });
  },
  async toAddShopCar() {
    this.bindGuiGeTap();
  },
  /**
   * 规格选择弹出框
   */
  async bindGuiGeTap() {
    this.setData({
      hideShopPopup: false,
      selectSizePrice: this.data.goodsDetail.basicInfo.minPrice,
      selectSizeOPrice: this.data.goodsDetail.basicInfo.originalPrice,
      skuGoodsPic: this.data.goodsDetail.basicInfo.pic
    })
    await this._goodsTimesSchedule()
  },
  /**
   * 规格选择弹出框隐藏
   */
  closePopupTap: function () {
    this.setData({
      hideShopPopup: true
    })
  },
  stepChange(event) {
    this.setData({
      buyNumber: event.detail
    })
  },
  /**
   * 选择商品规格
   */
  async labelItemTap(e) {
    const propertyindex = e.currentTarget.dataset.propertyindex
    const propertychildindex = e.currentTarget.dataset.propertychildindex

    const property = this.data.goodsDetail.properties[propertyindex]
    const child = property.childsCurGoods[propertychildindex]
    // 取消该分类下的子栏目所有的选中状态
    property.childsCurGoods.forEach(child => {
      child.active = false
    })
    // 设置当前选中状态
    property.optionValueId = child.id
    child.active = true
    // 获取所有的选中规格尺寸数据
    const needSelectNum = this.data.goodsDetail.properties.length
    let curSelectNum = 0;
    let propertyChildIds = "";
    let propertyChildNames = "";

    this.data.goodsDetail.properties.forEach(p => {
      p.childsCurGoods.forEach(c => {
        if (c.active) {
          curSelectNum++;
          propertyChildIds = propertyChildIds + p.id + ":" + c.id + ",";
          propertyChildNames = propertyChildNames + p.name + ":" + c.name + "  ";
        }
      })
    })
    let canSubmit = false;
    if (needSelectNum == curSelectNum) {
      canSubmit = true;
    }
    let skuGoodsPic = this.data.skuGoodsPic
    if (this.data.goodsDetail.subPics && this.data.goodsDetail.subPics.length > 0) {
      const _subPic = this.data.goodsDetail.subPics.find(ele => {
        return ele.optionValueId == child.id
      })
      if (_subPic) {
        skuGoodsPic = _subPic.pic
      }
    }
    this.setData({
      goodsDetail: this.data.goodsDetail,
      canSubmit,
      skuGoodsPic,
      propertyChildIds,
      propertyChildNames,
    })
    this.calculateGoodsPrice()
  },
  async calculateGoodsPrice() {
    // 计算最终的商品价格
    let price = this.data.goodsDetail.basicInfo.minPrice
    let originalPrice = this.data.goodsDetail.basicInfo.originalPrice
    let totalScoreToPay = this.data.goodsDetail.basicInfo.minScore
    let buyNumMax = this.data.goodsDetail.basicInfo.stores
    let buyNumber = this.data.goodsDetail.basicInfo.minBuyNumber
    // 计算 sku 价格
    if (this.data.canSubmit) {
      const token = wx.getStorageSync('token')
      const res = await WXAPI.goodsPriceV2({
        token: token ? token : '',
        goodsId: this.data.goodsDetail.basicInfo.id,
        propertyChildIds: this.data.propertyChildIds
      })
      if (res.code == 0) {
        price = res.data.price
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
            price = (price * 100 + small.price * 100) / 100
          }
        })
      })
    }
    this.setData({
      selectSizePrice: price,
      selectSizeOPrice: originalPrice,
      totalScoreToPay: totalScoreToPay,
      buyNumMax,
      buyNumber: (buyNumMax > buyNumber) ? buyNumber : 0
    });
  },
  /**
   * 选择可选配件
   */
  async labelItemTap2(e) {
    const propertyindex = e.currentTarget.dataset.propertyindex
    const propertychildindex = e.currentTarget.dataset.propertychildindex

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
  /**
   * 加入购物车
   */
  async addShopCar() {
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showToast({
          title: this.data.$t.goodsDetail.noSelectSku,
          icon: 'none'
        })
      }
      this.bindGuiGeTap()
      return
    }
    const goodsAddition = []
    if (this.data.goodsAddition) {
      let canSubmit = true
      this.data.goodsAddition.forEach(ele => {
        if (ele.required) {
          const a = ele.items.find(item => {
            return item.active
          })
          if (!a) {
            canSubmit = false
          }
        }
        ele.items.forEach(item => {
          if (item.active) {
            goodsAddition.push({
              id: item.id,
              pid: item.pid
            })
          }
        })
      })
      if (!canSubmit) {
        wx.showToast({
          title: this.data.$t.goodsDetail.noSelectAddtion,
          icon: 'none'
        })
        this.bindGuiGeTap()
        return
      }
    }
    if (this.data.buyNumber < 1) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectNumber,
        icon: 'none'
      })
      return
    }
    const isLogined = await AUTH.checkHasLogined()
    if (!isLogined) {
      return
    }
    const token = wx.getStorageSync('token')
    const goodsId = this.data.goodsDetail.basicInfo.id
    const sku = []
    if (this.data.goodsDetail.properties) {
      this.data.goodsDetail.properties.forEach(p => {
        sku.push({
          optionId: p.id,
          optionValueId: p.optionValueId
        })
      })
    }
    // 砍价的话先清空现有购物车
    if (this.data.curKanjiaprogress && this.data.curKanjiaprogress.kanjiaInfo.uid == this.data.curuid) {
      await WXAPI.shippingCarInfoRemoveAll(token)
    }
    const d = {
      token,
      goodsId,
      number: this.data.buyNumber,
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
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }

    this.closePopupTap();
    wx.showToast({
      title: this.data.$t.goodsDetail.addCartSuccess,
      icon: 'success'
    })
    this.shippingCartInfo()
    // 砍价的话跳转到下单页面
    if (this.data.curKanjiaprogress && this.data.curKanjiaprogress.kanjiaInfo.uid == this.data.curuid) {
      wx.navigateTo({
        url: '/pages/pay/index?kjId=' + this.data.curGoodsKanjia.id,
      })
    }
  },
  onShareAppMessage() {
    let _data = {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid'),
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
    if (this.data.kjJoinUid) {
      _data.title = this.data.curKanjiaprogress.joiner.nick + ' ' + this.data.$t.goodsDetail.inviteKanJia
      _data.path += '&kjJoinUid=' + this.data.kjJoinUid
    }
    return _data
  },
  getVideoSrc: function (videoId) {
    var that = this;
    WXAPI.videoDetail(videoId).then(function (res) {
      if (res.code == 0) {
        that.setData({
          videoMp4Src: res.data.fdMp4
        });
      }
    })
  },
  goIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },
  helpKanjia() {
    const _this = this;
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        _this.helpKanjiaDone()
      }
    })
  },
  helpKanjiaDone() {
    const _this = this;
    WXAPI.kanjiaHelp(wx.getStorageSync('token'), _this.data.kjId, _this.data.kjJoinUid, '').then(function (res) {
      if (res.code != 0) {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        return;
      }
      _this.setData({
        myHelpDetail: res.data
      });
      wx.showModal({
        confirmText: _this.data.$t.common.confirm,
        cancelText: _this.data.$t.common.cancel,
        content: _this.data.$t.goodsDetail.kanJiaAmount + ' ' + res.data.cutPrice,
        showCancel: false
      })
      _this.getGoodsDetailAndKanjieInfo(_this.data.goodsDetail.basicInfo.id)
    })
  },
  closePop() {
    this.setData({
      posterShow: false
    })
  },
  async drawSharePic() {
    const _this = this
    const qrcodeRes = await WXAPI.wxaQrcode({
      scene: _this.data.goodsDetail.basicInfo.id + ',' + wx.getStorageSync('uid'),
      page: 'pages/goods-details/index',
      is_hyaline: true,
      autoColor: true,
      expireHours: 1
    })
    if (qrcodeRes.code != 0) {
      wx.showToast({
        title: qrcodeRes.msg,
        icon: 'none'
      })
      return
    }
    const qrcode = qrcodeRes.data
    const pic = _this.data.goodsDetail.basicInfo.pic
    wx.getImageInfo({
      src: pic,
      success(res) {
        const height = 490 * res.height / res.width
        _this.drawSharePicDone(height, qrcode)
      },
      fail(e) {
        console.error(e)
      }
    })
  },
  drawSharePicDone(picHeight, qrcode) {
    const _this = this
    const _baseHeight = 74 + (picHeight + 120)
    this.setData({
      posterConfig: {
        width: 750,
        height: picHeight + 660,
        backgroundColor: '#fff',
        debug: false,
        blocks: [{
          x: 76,
          y: 74,
          width: 604,
          height: picHeight + 120,
          borderWidth: 2,
          borderColor: '#c2aa85',
          borderRadius: 8
        }],
        images: [{
            x: 133,
            y: 133,
            url: _this.data.goodsDetail.basicInfo.pic, // 商品图片
            width: 490,
            height: picHeight
          },
          {
            x: 76,
            y: _baseHeight + 199,
            url: qrcode, // 二维码
            width: 222,
            height: 222
          }
        ],
        texts: [{
            x: 375,
            y: _baseHeight + 80,
            width: 650,
            lineNum: 2,
            text: _this.data.goodsDetail.basicInfo.name,
            textAlign: 'center',
            fontSize: 40,
            color: '#333'
          },
          {
            x: 375,
            y: _baseHeight + 180,
            text: '￥' + _this.data.goodsDetail.basicInfo.minPrice,
            textAlign: 'center',
            fontSize: 50,
            color: '#e64340'
          },
          {
            x: 352,
            y: _baseHeight + 320,
            text: _this.data.$t.goodsDetail.longTapQrcode,
            fontSize: 28,
            color: '#999'
          }
        ],
      }
    }, () => {
      Poster.create();
    });
  },
  onPosterSuccess(e) {
    console.log('success:', e)
    this.setData({
      posterImg: e.detail,
      showposterImg: true
    })
  },
  onPosterFail(e) {
    console.error('fail:', e)
  },
  savePosterPic() {
    const _this = this
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImg,
      success: (res) => {
        wx.showModal({
          content: _this.data.$t.goodsDetail.qrcodeSaved,
          showCancel: false,
          confirmText: _this.data.$t.common.gotIt,
          confirmColor: '#333'
        })
      },
      complete: () => {
        _this.setData({
          showposterImg: false
        })
      },
      fail: (res) => {
        wx.showToast({
          title: res.errMsg,
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url] // 需要预览的图片http链接列表
    })
  },
  onTabsChange(e) {
    var index = e.detail.index
    this.setData({
      toView: this.data.tabs[index].view_id
    })
  },
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  joinKanjia() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.doneJoinKanjia();
      }
    })
  },
  doneJoinKanjia: function () { // 报名参加砍价活动
    const _this = this;
    if (!_this.data.curGoodsKanjia) {
      return;
    }
    wx.showLoading({
      title: ''
    })
    WXAPI.kanjiaJoin(wx.getStorageSync('token'), _this.data.curGoodsKanjia.id).then(function (res) {
      wx.hideLoading()
      if (res.code == 0) {
        _this.setData({
          kjJoinUid: wx.getStorageSync('uid'),
          myHelpDetail: null
        })
        _this.getGoodsDetailAndKanjieInfo(_this.data.goodsDetail.basicInfo.id)
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
      }
    })
  },
})

