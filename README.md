# Quick Console Log

一个用于快速添加 console.log 语句的 Cursor 插件。

## 功能

- 选中变量后，可以快速添加带有变量名的 console.log 语句
- 支持快捷键操作（默认未设置，可自定义）

## 使用方法

1. 在代码中选中一个变量
2. 按下快捷键或通过命令面板执行"Add Console Log Statement"命令
3. 插件会自动将选中的变量转换为带有变量名的 console.log 语句

例如，当你选中变量`user`时，插件会生成：

```javascript
console.log("user:", user);
```

## 开发

1. 克隆项目

```bash
git clone https://github.com/yourusername/quick-console-log.git
cd quick-console-log
```

2. 安装依赖

```bash
npm install
```

3. 编译项目

```bash
npm run compile
```

4. 打包插件

```bash
npm run package
```

## 发布

1. 更新版本号（package.json）
2. 运行打包命令生成.vsix 文件
3. 提交到 Cursor 插件市场

## 许可证

MIT
