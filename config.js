module.exports = {
  version: "4.6.2",
  note: '修复货到付款还是走支付流程的问题',
  subDomain: "beeorder", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
  customerServiceType: 'QW' // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服
}