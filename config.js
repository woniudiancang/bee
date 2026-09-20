module.exports = {
  version: "26.9.20",
  note: '优惠券领取、退回、失效、过期、使用增加微信订阅消息提醒',
  subDomain: "beeorder", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
  merchantId: 27, // 商户ID，可在后台工厂设置-->商户信息查看
  customerServiceType: 'QW' // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服
}