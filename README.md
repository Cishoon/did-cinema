# 基于分布式数字身份的电影院售票系统

该项目为2024年浙江大学软件学院夏令营数字身份分营作业项目。

### 技术架构

- **区块链**：Hyperledger Fabric
- **后端**：Express
- **前端**：Vue3 + Vite

### 主要实现内容

- 基于W3C规范的数字身份的分发
- 基于W3C可声明凭证的分发与验证
- 基于默克尔树的选择性披露和零知识证明

### 运行项目

前置条件：
- 安装docker
- node >= 1.18

#### 区块链

```bash
cd ./chaincode
npm install

cd ..
./startFabric.sh
```

#### 前端

```bash
cd ./client
npm install
npm run serve
```

#### 后端

```bash
cd ./server
npm install
npm start
```

详细描述见系统设计报告。
