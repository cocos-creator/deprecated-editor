# Fireball-x Editor

## 流程

### 初始化

未登录状态操作编辑器进入初始化状态，有以下可能的进入状态

 - 首次打开编辑器
 - 注销用户

初始化流程：

 - 用户登陆（输入用户名、密码）
   - 如果没有账号，进入注册流程
   - 如果忘记密码，进入密码提醒流程
 
 - 验证通过后，建立
   - fireball/share/{username} 目录，用于存放 share 相关文件

### 注册流程

 - POST 账号信息（email、name、password）
   - 成功则登陆
   - 失败停留在此

### 建立项目

 - 选择目录
 - 调用 newProject

### 打开项目

 - 选择目录
 - 调用 loadProject
