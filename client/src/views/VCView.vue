<template>
  <div class="container">
    <div style="margin-bottom: 20px">
      <a-button type="primary" @click="queryVCIssuerDIDDocument">
        查询公安局的数字身份文档
      </a-button>
    </div>
    <a-space direction="vertical">
      <a-card title="申请“出生年份”的可验证声明">
        <a-space>
          <p>出生年份：</p>
          <a-year-picker
            v-model="birthyear"
            style="width: 200px"
            :disabled-date="(current: Date) => {
              return dayjs(current).isBefore(dayjs('1900-01-01')) || dayjs(current).isAfter(dayjs('2020-12-31'));
            }"
            :default-picker-value="dayjs('2006-01-01')"
          />
          <a-button type="primary" @click="applyVCByBirthyear">提交</a-button>
        </a-space>
        <p>新申请的声明将会覆盖已有声明</p>
        <p>有效年份范围为[1900, 2020]</p>
      </a-card>
    </a-space>
  </div>

  <a-modal v-model:visible="modalVisible" width="auto">
    <template #title>
      <span>公安局的数字身份文档</span>
    </template>
    <div v-if="didDocument">
      <DIDDocumentCards :did-document="didDocument"></DIDDocumentCards>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { Message } from "@arco-design/web-vue";
import { onMounted, ref } from "vue";
import axios from "axios";
import DIDDocumentCards from "../components/DIDDocumentCards.vue";
import { useRouter } from "vue-router";
// import router from "../router";
const router = useRouter();

const didDocument = ref();
const modalVisible = ref(false);
const birthyear = ref();

onMounted(() => {});

const queryVCIssuerDIDDocument = async () => {
  const res = await axios.get(
    "http://123.60.186.80:3000/api/did/did:example:vcissuer"
  );
  if (res.status === 200) {
    didDocument.value = res.data;
    modalVisible.value = true;
  } else {
    Message.error("查询VC Issuer的DID文档失败");
  }
};

const storeVC = (vc: any) => {
  let vcListStr = localStorage.getItem("vc_list");
  if (!vcListStr) {
    vcListStr = "[]";
  }
  let vcList = JSON.parse(vcListStr);
  vcList.push(vc);
  localStorage.setItem("vc_list", JSON.stringify(vcList));
};

const applyVCByBirthyear = async () => {
  const didDocument = localStorage.getItem("did_document");
  if (!didDocument) {
    Message.error("请先到“个人信息”页面注册数字身份");
    return;
  }

  if (!birthyear.value) {
    Message.info("请选择出生年份");
    return;
  }

  const did = JSON.parse(didDocument).id;
  const res = await axios.post(
    "http://123.60.186.80:3000/api/vc/birthday_merkle/apply",
    {
      birthyear: birthyear.value,
      did,
    }
  );
  if (res.status === 200) {
    console.log(res.data);
    Message.success("申请成功");
    storeVC(res.data);

    router.push("/profile");
  } else {
    Message.error("申请成功");
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
