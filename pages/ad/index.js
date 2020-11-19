const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const APP = getApp()
APP.configLoadOK = () => {
  
}

Page({
  data: {
    addressList: [],
    addressEdit: false,
    cancelBtn: false,

    pickerRegionRange: [],
    pickerSelect:[0, 0, 0],
    showRegionStr: '选择行政地址（省、市、区县）',

    addressData: {}
  },
  // 添加地址
  addAddress: function() {
    this.setData({
      addressEdit: true,
      cancelBtn: true,
      id: null,
      addressData: {}
    })
  },
  // 取消编辑
  editCancel: function(){
    this.setData({
      addressEdit: false,         
    })
  },
  // 编辑地址
  async editAddress(e) {
    // wx.navigateTo({
    //   url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    // })
    var id = e.currentTarget.dataset.id    
    this.setData({ 
      addressEdit: true,
      cancelBtn: false,
      id:id,
    })
    if (id) { // 修改初始化数据库数据
      const res = await WXAPI.addressDetail(wx.getStorageSync('token'), id)
      if (res.code == 0) {
        var addressData = res.data.info
        console.log(addressData)
        var address = addressData.address        
        var pname = addressData.provinceStr
        var cname = addressData.cityStr
        var dname = addressData.areaStr
        // 
        var provinceId = addressData.provinceId
        var cityId = addressData.cityId
        var districtId = addressData.districtId

        this.setData({
          id: id,
          addressData: res.data.info,  
          address: res.data.info.address,        
          pname: pname,
          cname: cname,
          dname: dname,
          provinceId: provinceId,
          cityId: cityId,
          districtId: districtId,
        })
        // console.log(addressData)        
        this.initRegionDB(pname,cname,dname)
        this.provinces(provinceId,cityId,districtId) 
               
      } else {
        wx.showModal({
          title: '错误',
          content: '无法获取快递地址数据',
          showCancel: false
        })
      }
    } else {
      this.initRegionPicker()
    }  
    
  }, 
  // 选中地址
  selectTap: function(e) {
    var id = e.currentTarget.dataset.id;
    WXAPI.updateAddress({
      token: wx.getStorageSync('token'),
      id: id,
      isDefault: 'true'
    }).then(function(res) {
      wx.navigateBack({})
    })
  },
  // 删除地址按钮
  deleteAddress: function (e) {
    const _this = this
    const id = e.currentTarget.dataset.id;
    console.log(id)
    wx.showModal({
      title: '提示',
      content: '确定要删除该收货地址吗？',
      success: function (res) {
        if (res.confirm) {
          WXAPI.deleteAddress(wx.getStorageSync('token'), id).then(function () {
            _this.setData({
              addressEdit: false,
              cancelBtn: false,
            })
            _this.initShippingAddress()
          })
        } else {
          console.log('用户点击取消')
        }
      }
    })
  },
  // 微信读取
  readFromWx : function () {
    const _this = this
    wx.chooseAddress({
      success: function (res) {
        console.log(res)
        _this.initRegionDB(res.provinceName, res.cityName, res.countyName)
        _this.setData({
          wxaddress: res
        });
      }
    })
  },  
  // 获取地址列表
  async initShippingAddress() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.queryAddress(wx.getStorageSync('token'))
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        addressList: res.data
      });
    } else {
      this.setData({
        addressList: null
      });
    }
  },   
  // 省市选择器 三栏
  initRegionPicker () {
    WXAPI.province().then(res => {
      if (res.code === 0) {
        let _pickerRegionRange = []
        _pickerRegionRange.push(res.data)
        _pickerRegionRange.push([{ name: '请选择' }])
        _pickerRegionRange.push([{ name: '请选择' }])
        this.data.pickerRegionRange = _pickerRegionRange
        this.bindcolumnchange({ detail: { column: 0, value: 0 } })
      }
    })
  },
  async initRegionDB (pname, cname, dname) {
    this.data.showRegionStr = pname + cname + dname
    let pObject = undefined
    let cObject = undefined
    let dObject = undefined
    if (pname) {
      const index = this.data.pickerRegionRange[0].findIndex(ele=>{
        return ele.name == pname
      })      
      if (index >= 0) {
        this.data.pickerSelect[0] = index
        pObject = this.data.pickerRegionRange[0][index]
      }
    }    
    if (!pObject) {
      return
    }
    const _cRes = await WXAPI.nextRegion(pObject.id)
    if (_cRes.code === 0) {
      this.data.pickerRegionRange[1] = _cRes.data
      if (cname) {
        const index = this.data.pickerRegionRange[1].findIndex(ele => {
          return ele.name == cname
        })        
        if (index >= 0) {
          this.data.pickerSelect[1] = index
          cObject = this.data.pickerRegionRange[1][index]
        }
      }
    }    
    if (!cObject) {
      return
    }
    const _dRes = await WXAPI.nextRegion(cObject.id)
    if (_dRes.code === 0) {
      this.data.pickerRegionRange[2] = _dRes.data
      if (dname) {
        const index = this.data.pickerRegionRange[2].findIndex(ele => {
          return ele.name == dname
        })        
        if (index >= 0) {
          this.data.pickerSelect[2] = index
          dObject = this.data.pickerRegionRange[2][index]
        }
      }
    }
    this.setData({
      pickerRegionRange: this.data.pickerRegionRange,
      pickerSelect: this.data.pickerSelect,
      showRegionStr: this.data.showRegionStr,
      pObject: pObject,
      cObject: cObject,
      dObject: dObject
    })
    
  },  
  bindchange: function(e) {    
    const pObject = this.data.pickerRegionRange[0][e.detail.value[0]]
    const cObject = this.data.pickerRegionRange[1][e.detail.value[1]]
    const dObject = this.data.pickerRegionRange[2][e.detail.value[2]]
    const showRegionStr = pObject.name + cObject.name + dObject.name
    this.setData({
      pObject: pObject,
      cObject: cObject,
      dObject: dObject,
      showRegionStr: showRegionStr
    })
  },
  bindcolumnchange: function(e) {
    const column = e.detail.column
    const index = e.detail.value    
    const regionObject = this.data.pickerRegionRange[column][index]    
    if (column === 2) {
      this.setData({
        pickerRegionRange: this.data.pickerRegionRange
      })
      return
    }
    if (column === 1) {
      this.data.pickerRegionRange[2] = [{ name: '请选择' }]
    }
    if (column === 0) {
      this.data.pickerRegionRange[1] = [{ name: '请选择' }]
      this.data.pickerRegionRange[2] = [{ name: '请选择' }]
    }
    // // 后面的数组全部清空
    // this.data.pickerRegionRange.splice(column+1)
    // 追加后面的一级数组
    WXAPI.nextRegion(regionObject.id).then(res => {
      if (res.code === 0) {
        this.data.pickerRegionRange[column + 1] = res.data     
      }
      this.bindcolumnchange({ detail: { column: column + 1, value: 0 } })
    })
  },  
  // 
  async provinces(provinceId, cityId, districtId) {
    const res1 = await WXAPI.province()    
    const provinces = res1.data  
    this.setData({
      provinces,
    })     
    var pIndex = provinces.findIndex(ele => {
      return ele.id == provinceId
    })  
     
    const pid = this.data.provinces[pIndex].id    
    const res2 = await WXAPI.nextRegion(pid)
    const cities = res2.data  
    this.setData({
      cities,
    })  
    var  cIndex = cities.findIndex(ele => {
      return ele.id == cityId
    })
    
    const cid = this.data.cities[cIndex].id
    const res3 = await WXAPI.nextRegion(cid);
    const areas = res3.data
    this.setData({
      areas,
    })
    var aIndex = areas.findIndex(ele => {
      return ele.id == districtId
    })
    // var pIndex = pIndex + 1
    // var cIndex = cIndex + 1
    // var aIndex = aIndex + 1
    this.setData({
      pIndex: pIndex,
      cIndex: cIndex,
      aIndex: aIndex,
    })  
    
  },
  linkManChange(e) {
    const addressData = this.data.addressData
    addressData.linkMan = e.detail
    this.setData({
      addressData
    })
  },
  mobileChange(e) {
    const addressData = this.data.addressData
    addressData.mobile = e.detail
    this.setData({
      addressData
    })
  },
  addressChange(e) {
    const addressData = this.data.addressData
    addressData.address = e.detail
    this.setData({
      addressData
    })
  },
  // 保存按钮
  async bindSave() {    
    const pObject = this.data.pObject
    const cObject = this.data.cObject
    const dObject = this.data.dObject
    const linkMan = this.data.addressData.linkMan
    const address = this.data.addressData.address
    const mobile = this.data.addressData.mobile
    const latitude = this.data.addressData.latitude
    const longitude = this.data.addressData.longitude

    if (!linkMan){
      wx.showToast({
        title: '请填写用户姓名',
        icon: 'none',        
      })
      return
    }
    if (!mobile){
      wx.showToast({
        title: '请填写手机号码',
        icon: 'none',        
      })
      return
    }
    if (!this.data.pObject || !this.data.cObject || !this.data.dObject){
      wx.showToast({
        title: '请选择行政区划',
        icon: 'none',        
      })
      return
    }
    if (!latitude){
      wx.showToast({
        title: '请选择定位',
        icon: 'none',       
      })
      return
    }
    if (!address){
      wx.showToast({
        title: '请填写详细地址',
        icon: 'none',       
      })
      return
    }
    
    const postData = {
      token: wx.getStorageSync('token'),
      linkMan: linkMan,
      address: address,
      mobile: mobile,
      isDefault: 'true',
      latitude,
      longitude
    }     

    // console.log(this.data.pIndex)
    // console.log(this.data.cIndex)
    // console.log(this.data.aIndex)

    postData.provinceId = pObject.id
    postData.cityId = cObject.id  
    postData.districtId = dObject.id

    // if (this.data.pIndex >= 0) {
    //   postData.provinceId = pObject.id    
    // }
    // if (this.data.cIndex >= 0) {
    //   postData.cityId = cObject.id  
    // }
    // if (this.data.aIndex >= 0) {
    //   postData.districtId = dObject.id  
    // }    
    let apiResult
    console.log(this.data.id)
    if (this.data.id) {
      postData.id = this.data.id
      apiResult = await WXAPI.updateAddress(postData)
    } else {
      apiResult = await WXAPI.addAddress(postData)
    }
    if (apiResult.code != 0) {
      // 登录错误 
      wx.hideLoading();
      wx.showToast({
        title: apiResult.msg,
        icon: 'none'
      })
      return;
    } else {
      this.setData({
        addressEdit: false,
        cancelBtn: false,
      })
      this.initShippingAddress()
    }    
    
  },
  onLoad: function (e) {    
    const _this = this
    _this.initRegionPicker() // 初始化省市区选择器
    if (e.id) { // 修改初始化数据库数据
      WXAPI.addressDetail(e.id, wx.getStorageSync('token')).then(function (res) {
        if (res.code === 0) {
          _this.setData({
            id: e.id,
            addressData: res.data,
            showRegionStr: res.data.provinceStr + res.data.cityStr + res.data.areaStr
          });
          _this.initRegionDB(res.data.provinceStr, res.data.cityStr, res.data.areaStr)
          return;
        } else {
          wx.showModal({
            title: '提示',
            content: '无法获取快递地址数据',
            showCancel: false
          })
        }
      })
    }
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.initShippingAddress();
      } else {
        wx.showModal({
          content: '登陆后才能访问',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    })
  },  
  
  // 判断电话号码格式
  setTelModal:function(e) {
    // console.log(e)    
    var mobile = /^[1][3,4,5,7,8][0-9]{9}$/;
    // var myreg = /^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$/;  //判断是否是座机电话
    
    var isMobile = mobile.exec(e.detail.value)
    //输入有误的话，弹出模态框提示
    if(!isMobile){
      wx.showModal({
        title: '错误',
        content: '手机号码格式不正确',
        showCancel:false
      })
    }
  },
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const addressData = this.data.addressData
        addressData.address = res.address + res.name
        addressData.latitude = res.latitude
        addressData.longitude = res.longitude
        this.setData({
          addressData
        })
      },
      fail: (e) => {
        console.error(e)
      },
    })
  }
})

