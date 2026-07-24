// 短信服务商接口占位层。未配置真实服务商时，验证码仅打印在控制台，方便本地开发测试。
// 正式上线前，请依 SMS_PROVIDER 串接对应厂商 SDK（如阿里云、腾讯云短信服务），
// 并删除 devFallback 分支，避免验证码外泄至日志。

async function sendSmsCode(phone, code) {
  var provider = process.env.SMS_PROVIDER;

  if (provider === 'aliyun') {
    // 示例：接入阿里云短信服务时，在此调用 @alicloud/sms-sdk 或官方 SDK 发送短信
    // const client = require('@alicloud/sms-sdk')(...);
    // await client.sendSMS({
    //   PhoneNumbers: phone,
    //   SignName: process.env.SMS_SIGN_NAME,
    //   TemplateCode: process.env.SMS_TEMPLATE_CODE,
    //   TemplateParam: JSON.stringify({ code: code })
    // });
    throw new Error('尚未完成阿里云短信服务对接，请在 services/smsProvider.js 中补上真实调用');
  }

  devFallback(phone, code);
}

function devFallback(phone, code) {
  console.log('[开发模式-短信验证码] 手机号 ' + phone + ' 的验证码为：' + code + '（未配置正式短信服务商，仅打印于控制台）');
}

module.exports = { sendSmsCode: sendSmsCode };
