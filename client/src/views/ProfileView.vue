<template>
  <div class="container">
    <h1>数字身份文档</h1>
    <div
      v-if="!didDocument || JSON.stringify(didDocument) === '{}'"
      style="display: flex; justify-content: center"
    >
      <p>您还没有数字身份，</p>
      <a-link type="primary" @click="createDID">立即注册DID</a-link>
    </div>
    <div v-else>
      <DIDDocumentCards
        :private-key="privateKey"
        :did-document="didDocument"
      ></DIDDocumentCards>
    </div>
    <a-divider />
    <h1>出生证明</h1>

    <div
      v-if="!vcList || vcList.length === 0"
      style="display: flex; justify-content: center"
    >
      <p>您还没有出生证明，</p>
      <a-link type="primary" @click="gotoVCView">立即申请</a-link>
    </div>
    <div v-else>
      <VCCards :vc="vcList[vcList.length - 1]" :max-height="'100vh'"></VCCards>
    </div>
    <br />
    <a-button
      v-if="vcList && vcList.length > 0"
      type="primary"
      @click="showTestVC(vcList[vcList.length - 1])"
      >测试：零知识证明</a-button
    >

    <a-divider></a-divider>
    <a-button
      type="primary"
      status="danger"
      @click="deleteAllRecords"
      style="margin-top: 16px; align-self: center"
    >
      删除所有本地记录
    </a-button>
  </div>

  <a-modal v-model:visible="modalVisible2" width="auto">
    <template #title>
      <span>
        生成
        <B>不包含出生年份 </B>
        的可验证声明
      </span>
    </template>
    <div
      v-if="selectedVC && selectedVC.credentialSubject.birthYearAssert"
      style="min-width: 40vw"
    >
      <p>
        这张出生证明（可校验凭证，VC）证明了用户的出生年份为{{
          selectedVC.credentialSubject.birthYearAssert.birthYearIndex +
          selectedVC.credentialSubject.birthYearAssert.min -
          1
        }}年
      </p>
      <p>试将该出生证明中的出生年份信息匿名化，生成新的可验证声明，表示：</p>
      <a-space>
        <p>用户在</p>
        <!-- <a-input v-model="testBirthYear" @change="testChange"></a-input> -->
        <a-input-number
          placeholder="出生年份"
          v-model="testBirthYear"
          mode="button"
          @change="testChange"
          :step="1"
          :precision="0"
          :max="2020"
          :min="1900"
        />
        <p>年</p>
        <a-select v-model="testBirthStatus" @change="testChange">
          <a-option :value="1">已出生</a-option>
          <a-option :value="0">未出生</a-option>
        </a-select>
      </a-space>
      <p>匿名后的证明如下</p>
      <div v-if="testVC">
        <VCCards :vc="testVC" :max-height="'40vh'"></VCCards>
      </div>
      <a-space>
        <p>将生成的证明发送给服务器进行有效性测试：</p>
        <a-button type="primary" @click="testSendVP">发送</a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { generateKeyPair } from "../utils/did/did";
import { Message } from "@arco-design/web-vue";
import { inject, onMounted, ref } from "vue";
import axios from "axios";
import DIDDocumentCards from "../components/DIDDocumentCards.vue";
import VCCards from "../components/VCCards.vue";
import router from "../router";
import {
  VerifiableCredential,
  VerifiablePresentation,
} from "../utils/vc/VerifiableCredentials";
import { generateVP } from "../utils/vc/vc";

const modalVisible2 = ref(false);
const selectedVC = ref<VerifiableCredential>();
const testBirthYear = ref();
const testBirthStatus = ref();
const testVP = ref<VerifiablePresentation>();
const testVC = ref<VerifiableCredential>();
const testSendVP = async () => {
  if (!testVP.value) return;

  const res = await axios.post(
    "http://123.60.186.80:3000/api/vc/birthday_merkle/verify",
    {
      vp: testVP.value,
    }
  );
  if (res.status === 200) {
    if (res.data.verified) {
      Message.success(res.data.message);
    } else {
      Message.error(res.data.message);
    }
  } else {
    Message.error("发送验证请求失败");
  }
};

const testChange = async () => {
  if (!selectedVC.value) return;

  // console.log(testBirthStatus.value, testBirthYear.value);
  testBirthYear.value = parseInt(testBirthYear.value);

  const assert = `${testBirthYear.value}:${testBirthStatus.value}`;
  console.log(assert);

  try {
    testVP.value = await generateVP(selectedVC.value, assert);
  } catch (error: any) {
    Message.error(error.message);
  }
  if (!testVP.value) return;

  testVC.value = testVP.value.verifiableCredential[0];

  Message.info("凭证已更新");
};
const showTestVC = (vc: VerifiableCredential) => {
  selectedVC.value = Object.assign({}, vc);
  modalVisible2.value = true;

  testBirthStatus.value = 1;
  testBirthYear.value = 2006;

  testChange();
};
// 从本地存储中获取DID
// let didDocument = ref(JSON.parse(localStorage.getItem("did_document") || "{}"));
const didDocument = ref();
const privateKey = ref();
const secretVisible = ref(false);

const vcList = ref([]);

const reload = inject("reload") as () => void;

const gotoVCView = () => {
  router.push("/applyVC");
};

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

  const vcListStr = localStorage.getItem("vc_list") || "[]";
  vcList.value = JSON.parse(vcListStr);
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

    reload();
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

    reload();
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
