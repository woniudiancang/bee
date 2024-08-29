const WXAPI = require('apifm-wxapi')
const CONFIG = require('config.js')
const AUTH = require('utils/auth')
const i18n = require("i18n/index")
App({
  onLaunch: function() {
    i18n.getLanguage()
    this.setTabBarLanguage()
    const $t = i18n.$t()
    WXAPI.init(CONFIG.subDomain)
    WXAPI.setMerchantId(CONFIG.merchantId)
    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        confirmText: $t.common.confirm,
        cancelText: $t.common.cancel,
        content: $t.common.upgrade,
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: $t.common.noNetwork,
            icon: 'loading'
          })
        }
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function(res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: $t.common.networkDown,
          icon: 'loading'
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    })
    WXAPI.queryConfigBatch('mallName,myBg,mapPos,order_hx_uids,subscribe_ids,share_profile,zxdz,admin_uids,shop_goods_split,QQ_MAP_KEY,shop_join_open,create_order_select_time,packaging_fee,customerServiceChatCorpId,customerServiceChatUrl,alipay').then(res => {
      if (res.code == 0) {
        res.data.forEach(config => {
          wx.setStorageSync(config.key, config.value);
        })
        if (this.configLoadOK) {
          this.configLoadOK()
        }
      }
    })
  },
  onShow (e) {
    if (e && e.query && e.query.scene) {
      const scene = decodeURIComponent(e.query.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length == 3) {
        // 扫码点餐
      } else {
        AUTH.checkHasLogined().then(isLogined => {
          if (!isLogined) {
            AUTH.authorize()
          }
        })
      }
    } else {
      AUTH.checkHasLogined().then(isLogined => {
        if (!isLogined) {
          AUTH.authorize()
        }
      })
    }
    // 保存邀请人
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
      if (e.shareTicket) {
        wx.getShareInfo({
          shareTicket: e.shareTicket,
          success: res => {
            console.log(res)
            console.log({
              referrer: e.query.inviter_id,
              encryptedData: res.encryptedData,
              iv: res.iv
            })
            wx.login({
              success(loginRes) {
                if (loginRes.code) {
                  WXAPI.shareGroupGetScore(
                    loginRes.code,
                    e.query.inviter_id,
                    res.encryptedData,
                    res.iv
                  ).then(_res => {
                    console.log(_res)
                  }).catch(err => {
                    console.error(err)
                  })
                } else {
                  console.error(loginRes.errMsg)
                }
              }
            })
          }
        })
      }
    }
    this.refreshStorageShopInfo()
  },
  async refreshStorageShopInfo() {
    // 刷新本地缓存的门店信息 https://www.yuque.com/apifm/nu0f75/cu4cfi
    let shopInfo = wx.getStorageSync('shopInfo')
    if (!shopInfo) {
      return
    }
    const res = await WXAPI.shopSubdetail(shopInfo.id)
    if (res.code == 0) {
      const distance = shopInfo.distance
      shopInfo = res.data.info
      shopInfo.distance = distance
      wx.setStorageSync('shopInfo',  shopInfo)
    }
  },
  initLanguage(_this) {
    _this.setData({
      language: i18n.getLanguage(),
      $t: i18n.$t(),
    })
  },
  changeLang(_this) {
    const langs = i18n.langs
    const nameArray = []
    langs.forEach(ele => nameArray.push(ele.name))
    wx.showActionSheet({
      itemList: nameArray,
      success: (e) => {
        const lang = langs[e.tapIndex]
        wx.setStorageSync('Language', lang.code)
        _this.setData({
          language: i18n.getLanguage(),
          $t: i18n.$t(),
        })
        this.setTabBarLanguage()
      }
    })
  },
  setTabBarLanguage() {
    i18n.setTabBarLanguage()
  },
  globalData: {
    isConnected: true
  }
})