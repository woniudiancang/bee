/**
 * 获取当前使用的语言
 */
function getLanguage() {
  const Language = wx.getStorageSync('Language')
  if (Language) {
    return Language
  }
  const allowLanguage = ['zh_CN', 'en'] // 目前支持的语言包
  const appBaseInfo = wx.getAppBaseInfo()
  let _language = appBaseInfo.language || 'zh_CN'
  if (!allowLanguage.includes(_language)) {
    _language = 'zh_CN'
  }
  wx.setStorageSync('Language', _language)
  return _language
}
function $t(){
  return require(getLanguage() + '.js');
}

function setTabBarLanguage(){
  const $t = this.$t()
  wx.setTabBarItem({
    index: 0,
    pagePath: "pages/index/index",
    iconPath: "images/nav/index-off.png",
    selectedIconPath: "images/nav/index-on.png",
    text: $t.index.order
  })

  wx.setTabBarItem({
    index: 1,
    pagePath: "pages/queue/index",
    iconPath: "images/nav/qh-off.png",
    selectedIconPath: "images/nav/qh-on.png",
    text: $t.queue.t
  })

  wx.setTabBarItem({
    index: 2,
    pagePath: "pages/order-details/doing",
    iconPath: "images/nav/qc-off.png",
    selectedIconPath: "images/nav/qc-on.png",
    text: $t.index.PickingUp
  })

  wx.setTabBarItem({
    index: 3,
    pagePath: "pages/my/index",
    iconPath: "images/nav/my-off.png",
    selectedIconPath: "images/nav/my-on.png",
    text: $t.my.title
  })
}
module.exports = {
  setTabBarLanguage: setTabBarLanguage,
  getLanguage: getLanguage,
  $t: $t,
  langs: [
    {
      name: '简体中文',
      code: 'zh_CN'
    },
    {
      name: 'English',
      code: 'en'
    }
  ]
}