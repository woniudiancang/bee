/**
 * 获取当前使用的语言
 */
function getLanguage() {
  const Language = wx.getStorageSync('Language')
  if (Language) {
    return Language
  }
  const appBaseInfo = wx.getAppBaseInfo()
  const _language = appBaseInfo.language || 'zh_CN'
  wx.setStorageSync('Language', _language)
  return _language
}
function $t(){
  return require(getLanguage() + '.js');
}

function setTabBarLanguage(){
  wx.setTabBarItem({
    index: 0,
    pagePath: "pages/index/index",
    iconPath: "images/nav/home-off.png",
    selectedIconPath: "images/nav/home-on.png",
    text: translateTxt("首页")
  })

  wx.setTabBarItem({
    index: 1,
    pagePath: "pages/category/category",
    iconPath: "images/nav/ic_catefory_normal.png",
    selectedIconPath: "images/nav/ic_catefory_pressed.png",
    text: translateTxt("分类")
  })

  wx.setTabBarItem({
    index: 2,
    pagePath: "pages/shop-cart/index",
    iconPath: "images/nav/cart-off.png",
    selectedIconPath: "images/nav/cart-on.png",
    text: translateTxt("购物车")
  })

  wx.setTabBarItem({
    index: 3,
    pagePath: "pages/my/index",
    iconPath: "images/nav/my-off.png",
    selectedIconPath: "images/nav/my-on.png",
    text: translateTxt("我的")
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