const WXAPI = require('apifm-wxapi')
const CONFIG = require('config.js')
const AUTH = require('utils/auth')
App({
  onLaunch: function() {    
    WXAPI.init(CONFIG.subDomain)
    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
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
            title: '当前无网络',
            icon: 'loading',
            duration: 2000
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
          title: '网络已断开',
          icon: 'loading',
          duration: 2000
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    })
    WXAPI.queryConfigBatch('mallName,myBg,mapPos,order_hx_uids,subscribe_ids,share_profile,zxdz,admin_uids,shop_goods_split').then(res => {
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
                  console.error('登录失败！' + loginRes.errMsg)
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
  globalData: {
    isConnected: true
  }
})