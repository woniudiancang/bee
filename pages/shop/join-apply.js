const WXAPI = require('apifm-wxapi')

Page({
  data: {
    autosize: {
      minHeight: 100
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.shop.join,
    })
  },
  onShow: function() {
  },
  async bindSave() {    
    if (!this.data.name) {
      wx.showToast({
        title: this.data.$t.shop.nameRequired,
        icon: 'none',
      })
      return
    }
    if (!this.data.mobile) {
      wx.showToast({
        title: this.data.$t.shop.mobileRequired,
        icon: 'none',
      })
      return
    }
    if (!this.data.content) {
      this.data.content = '申请入驻'
    }
    if (!this.data.content) {
      wx.showToast({
        title: this.data.$t.shop.contentRequired,
        icon: 'none',
      })
      return
    }
    const extJsonStr = {}
    extJsonStr['姓名'] = this.data.name
    extJsonStr['联系电话'] = this.data.mobile

    // 批量上传附件
    if (this.data.picsList) {
      for (let index = 0; index < this.data.picsList.length; index++) {
        const pic = this.data.picsList[index];
        const res = await WXAPI.uploadFileV2(wx.getStorageSync('token'), pic.url)
        if (res.code == 0) {
          extJsonStr['file' + index] = res.data.url
        }
      }
    }

    const res = await WXAPI.addComment({
      token: wx.getStorageSync('token'),
      type: 1,
      extJsonStr: JSON.stringify(extJsonStr),
      content: this.data.content
    })
    if (res.code == 0) {
      wx.showToast({
        title: this.data.$t.common.submitSuccess,
      })
      setTimeout(() => {
        wx.navigateBack({
          delta: 0,
        })
      }, 1000);
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  afterPicRead(e) {
    let picsList = this.data.picsList
    if (!picsList) {
      picsList = []
    }
    picsList = picsList.concat(e.detail.file)
    this.setData({
      picsList
    })
  },
  afterPicDel(e) {
    let picsList = this.data.picsList
    picsList.splice(e.detail.index, 1)
    this.setData({
      picsList
    })
  }
})