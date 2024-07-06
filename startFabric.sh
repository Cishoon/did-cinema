cd ./test-network

./network.sh down

# 启动Fabric网络，包含两个对等节点和一个排序节点
./network.sh up 

# 创建一个通道用于存储DID Document
./network.sh createChannel -c w3c-did

# 给w3c-did通道安装链码
./network.sh deployCC -ccn did-contract -ccp ../chaincode -ccl typescript -c w3c-did