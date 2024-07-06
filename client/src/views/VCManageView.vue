<template>
  <div id="container">
    <a-table
      :columns="columns"
      :data="dataList"
      :row-key="'id'"
      :loading="loading"
    >
      <template #optional="{ record }">
        <a-space>
          <a-button type="primary" @click="showVC(record)">查看</a-button>
          <a-button status="danger" @click="deleteVC(record)">删除</a-button>
          <a-button status="warning" @click="verifyVC(record)">验证</a-button>
        </a-space>
      </template>
    </a-table>
  </div>

  <a-modal v-model:visible="modalVisible" width="auto">
    <template #title>
      <span>VC 详细内容</span>
    </template>
    <div v-if="selectedVC">
      <!-- <DIDDocumentCards :did-document="didDocument"></DIDDocumentCards> -->
      <VCCards :vc="selectedVC"></VCCards>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { VerifiableCredential } from "../utils/vc/VerifiableCredentials";
import VCCards from "../components/VCCards.vue";
import { createVerifiablePresentation } from "../utils/vc/vc";
import { Message } from "@arco-design/web-vue";

const modalVisible = ref(false);
const selectedVC = ref<VerifiableCredential>();

const showVC = (vc: VerifiableCredential) => {
  selectedVC.value = Object.assign({}, vc);
  modalVisible.value = true;
};

const deleteVC = (vc: VerifiableCredential) => {
  console.log(vc.id);
  // 删除vc.id对应的凭证
  const vcListStr = localStorage.getItem("vc_list");
  if (vcListStr) {
    const vcList = JSON.parse(vcListStr);
    const newVCList = vcList.filter((item: VerifiableCredential) => {
      // 如果item有id字段，就用id字段判断，否则用索引判断
      if (item.id) {
        return item.id !== vc.id;
      } else {
        return vcList.indexOf(item) + 1 !== vc.id;
      }
    });
    localStorage.setItem("vc_list", JSON.stringify(newVCList));
    loadData();
  }
};

const columns = [
  {
    title: "ID",
    dataIndex: "id",
  },
  {
    title: "发证人",
    dataIndex: "issuer",
  },
  {
    title: "发证日期",
    dataIndex: "issuanceDate",
  },
  {
    title: "操作",
    slotName: "optional",
  },
];

const searchParams = ref({
  pageSize: 10,
  current: 1,
});

const vcList = ref([]);
const dataList = ref([]);
const total = ref(0);
const loading = ref(true);

const loadData = async () => {
  loading.value = true;

  const vcListStr = localStorage.getItem("vc_list");
  if (vcListStr) {
    vcList.value = JSON.parse(vcListStr);
  }
  // 根据searchParams中的内容设置dataList
  const start = (searchParams.value.current - 1) * searchParams.value.pageSize;
  const end = start + searchParams.value.pageSize;
  dataList.value = vcList.value.slice(start, end);
  // 给dataList中的数据添加id字段
  dataList.value.forEach((item, index) => {
    if (!item.id) item.id = start + index + 1;
  });

  total.value = vcList.value.length;

  loading.value = false;
};

onMounted(() => {
  loadData();
});

const verifyVC = async (vc: VerifiableCredential) => {
  // 获取did和privateKey
  const didDocument = localStorage.getItem("did_document");
  if (!didDocument) {
    Message.error("请先注册DID");
    return;
  }
  const did = JSON.parse(didDocument).id;

  const keyPair = localStorage.getItem("key_pair");
  const privateKey = keyPair ? JSON.parse(keyPair).privateKey : "";
  if (!privateKey) {
    Message.error("找不到私钥");
    return;
  }

  // 将VC打包成VP，发送给验证者
  const vp = await createVerifiablePresentation(did, [vc], privateKey);
  console.log(vp);
};
</script>

<style scoped>
#container {
  background-color: var(--color-bg-5);
  padding: 20px;
  height: 100%;
}
</style>
