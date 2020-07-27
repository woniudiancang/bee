# 微信小程序——餐饮点餐商城

微信小程序——餐饮点餐商城，是针对餐饮行业推出的一套完整的餐饮解决方案，实现了用户在线点餐下单、外卖、叫号排队、支付、配送等功能，完美的使餐饮行业更高效便捷！

大家如果在使用过程有什么问题，欢迎通过lssues与我们交流！

# 功能展示
## 首页
| 首页 | 定位功能及门店信息 | 下单 | 拼单 |
| :------: | :------: | :------: | :------: |
| <img src="https://dcdn.it120.cc/2020/07/27/36ed1118-9f8f-4e7e-bb00-ed85586b038a.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/bc0fe85c-e6ba-4fa7-9c7d-26e47c087b88.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/bdfc8ac3-7917-42f1-98f8-dd2b6bf032b6.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/0bebe027-4fe7-406b-8be0-4cad2c8825e8.png" width="200px">

## 购物车 支付
| 购物车 | 支付 | 
| :------: | :------: | 
|<img src="https://dcdn.it120.cc/2020/07/27/1acad133-9b1e-4985-b4d8-9f2aa3d486b9.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/bf879a32-cb31-44de-b5e0-58b2b874aae9.png" width="200px">



## 我的
| 我的 | 会员中心 | 优惠买单 | 收货地址 |
| :------: | :------: | :------: | :------: |
| <img src="https://dcdn.it120.cc/2020/07/27/763290c1-8475-47f9-a991-4510d4f6301a.png" width="200px">| <img src="https://dcdn.it120.cc/2020/07/27/0f9c857f-174a-4dec-a5b4-fec5e4e71eb9.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/fa908388-4669-4587-bca7-e8cf89c86e16.png" width="200px">|<img src="https://dcdn.it120.cc/2020/07/27/99b6ec38-a4d2-4fc8-8b44-596920497115.png" width="200px">


# QQ交流群

<img src="https://dcdn.it120.cc/2020/07/27/e3d09fd2-ace0-4cf4-9d71-e0454591ff54.png " width="200px">

# 本项目使用了下面的组件，在此鸣谢

- [接口 SDK](https://github.com/gooking/apifm-wxapi)

- [api工厂](https://admin.it120.cc)

# 使用教程
## 注册开通小程序账号
https://mp.weixin.qq.com/
根据自己的实际情况选择 “企业”、“个体工商户”身份，注册小程序账号，商城类小程序不支持个人用户上线，所以一定要选择企业或者个体户，获得你自己小程序的 appid 和 secret 信息，保存好，下面会用到：
- [如何查看小程序的AppID和AppSecret](https://jingyan.baidu.com/article/642c9d340305e3644a46f795.html)
你需要设置小程序的合法域名，否则开发工具上运行正常，手机访问的时候将看不到数据
- [设置合法服务器域名](https://www.it120.cc/help/tvpou9.html)
## 注册开通后台账号
https://admin.it120.cc/
免费注册开通新后台后登录，登录后的首页，请记下你的专属域名，后面会用到
左侧菜单 “工厂设置” --> “数据克隆” --> “将别人的数据克隆给我”
对方商户ID填写 27
点击 “立即克隆”，克隆成功后，F5 刷新一下后台
## 配置小程序APPID/SECRET
左侧菜单，微信设置，填写配置上一步获得的 appid 和 secret
这一步很重要！！！
如果没有正确配置，下面步骤中打开小程序将无法连接你的后台
## 配置微信支付
左侧菜单，系统设置 -->  在线支付配置，填写您自己的微信支付的信息
## 下载安装开发工具
https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
## 运行小程序看效果
双击运行第一步安装的小程序开发工具，打开看效果：

<img src="https://dcdn.it120.cc/yuque/0/2019/png/572726/1575349127431-00ff2059-dd5e-4e4b-99a7-e1d605db02c7.png?x-oss-process=image%2Fresize%2Cw_1500 " width="200px">

导入项目这里，目录选择你 “第二步” 中下载并加压的小程序代码所在目录

APPID 务必要改成你自己的小程序的 APPID
APPID 务必要改成你自己的小程序的 APPID
APPID 务必要改成你自己的小程序的 APPID

然后点击导入按钮

- [如何查看小程序的AppID和AppSecret](https://jingyan.baidu.com/article/642c9d340305e3644a46f795.html)

## 配置对接你自己的后台
在开发工具中 config.js 中的subDomain 改成你自己专属域名， ctrl + s 保存

<img src="https://dcdn.it120.cc/yuque/0/2020/png/572726/1581236703094-ce5c7f32-c60d-4e1b-bacb-21439e1d2721.png?x-oss-process=image%2Fresize%2Cw_1500 " width="200px">

- [如何查看自己的subDomain](https://www.it120.cc/help/qr6l4m.html)







