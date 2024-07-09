<template>
  <div class="container">
    <div
      v-if="!didDocument || JSON.stringify(didDocument) === '{}'"
      style="display: flex; justify-content: center"
    >
      <p>您还没有数字身份，</p>
      <a-link type="primary" @click="createDID">立即创建DID</a-link>
    </div>
    <div v-else>
      <DIDDocumentCards
        :private-key="privateKey"
        :did-document="didDocument"
      ></DIDDocumentCards>
      <a-button
        type="primary"
        status="danger"
        @click="deleteAllRecords"
        style="margin-top: 16px; align-self: center"
      >
        删除所有本地记录
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateKeyPair } from "../utils/did/did";
import { Message } from "@arco-design/web-vue";
import { onMounted, ref } from "vue";
import axios from "axios";
import DIDDocumentCards from "../components/DIDDocumentCards.vue";

// 从本地存储中获取DID
// let didDocument = ref(JSON.parse(localStorage.getItem("did_document") || "{}"));
const didDocument = ref();
const privateKey = ref();
const secretVisible = ref(false);

onMounted(() => {
  let _did_document = localStorage.getItem("did_document");

  if (!_did_document) {
    _did_document = "{}";
  }

  try {
    didDocument.value = JSON.parse(_did_document);
  } catch (error) {
    console.log("本地存储中的DID数据解析失败");
    didDocument.value = {};
    localStorage.setItem("did_document", JSON.stringify({}));
  }

  let _key_pair = localStorage.getItem("key_pair");
  privateKey.value = _key_pair ? JSON.parse(_key_pair).privateKey : "";
});

// 创建DID
const createDID = async () => {
  Message.info("正在创建DID，请稍等...");

  const keyPair = await generateKeyPair();
  console.log(keyPair);

  // 向http://123.60.186.80:3000/api/did
  const res = await axios.post("http://123.60.186.80:3000/api/did", {
    type: "secp256k1",
    publicKeyMultibase: keyPair.publicKey,
  });
  if (res.status === 200) {
    Message.success("创建DID成功");
    didDocument.value = res.data.document;
    privateKey.value = keyPair.privateKey;
    localStorage.setItem("did_document", JSON.stringify(didDocument.value));
    localStorage.setItem("key_pair", JSON.stringify(keyPair));
  } else {
    Message.error("创建DID失败");
    console.log(res);
  }
};

// 删除所有记录
const deleteAllRecords = () => {
  if (confirm("确定要删除所有记录吗？此操作不可撤销")) {
    localStorage.clear();
    didDocument.value = {};
    privateKey.value = "";
  }
};
</script>

<style scoped>
.container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
