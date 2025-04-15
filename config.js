module.exports = {
  version: "25.04.15",
  note: '扫码点餐支付功能改进',
  subDomain: "beeorder", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
  merchantId: 27, // 商户ID，可在后台工厂设置-->商户信息查看
  customerServiceType: 'QW' // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服
}