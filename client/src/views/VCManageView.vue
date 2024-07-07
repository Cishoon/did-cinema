<template>
  <div id="container">
    <a-table
      :columns="columns"
      :data="dataList"
      :row-key="'id'"
      :loading="loading"
      :pagination="{
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        showTotal: true,
        total: total,
      }"
      @pageChange="handlePageChange"
    >
      <template #id="{ rowIndex }">
        {{
          rowIndex + 1 + searchParams.pageSize * (searchParams.current - 1)
        }}</template
      >
      <template #issuanceDate="{ record }">
        {{ formatDateTime(record.issuanceDate) }}
      </template>
      <template #optional="{ record, rowIndex }">
        <a-space>
          <a-button type="primary" @click="showVC(record)">查看</a-button>
          <a-button status="danger" @click="deleteVC(rowIndex)">删除</a-button>
          <!-- <a-button status="warning" @click="verifyVC(record)">验证</a-button> -->
          <a-button status="warning" @click="showTestVC(record)">
            测试
          </a-button>
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
        这张VC证明了用户的出生年份为{{
          selectedVC.credentialSubject.birthYearAssert.birthYearIndex +
          selectedVC.credentialSubject.birthYearAssert.min -
          1
        }}年
      </p>
      <p>试将该VC中的出生年份信息匿名化，生成新的可验证声明，表示：</p>
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
      <p>生成的证明如下</p>
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
import { ref, onMounted } from "vue";
import {
  VerifiableCredential,
  VerifiablePresentation,
} from "../utils/vc/VerifiableCredentials";
import VCCards from "../components/VCCards.vue";
import { anonymousVC, createVerifiablePresentation } from "../utils/vc/vc";
import { Message } from "@arco-design/web-vue";
import axios from "axios";
import { formatDateTime } from "../utils/utils";

const modalVisible = ref(false);
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

const showVC = (vc: VerifiableCredential) => {
  selectedVC.value = Object.assign({}, vc);
  modalVisible.value = true;
};

const showTestVC = (vc: VerifiableCredential) => {
  selectedVC.value = Object.assign({}, vc);
  modalVisible2.value = true;

  testBirthStatus.value = 1;
  testBirthYear.value = 2012;

  testChange();
};

const deleteVC = (rowIndex: any) => {
  const id =
    rowIndex + searchParams.value.pageSize * (searchParams.value.current - 1);
  // 删除vc.id对应的凭证
  const vcListStr = localStorage.getItem("vc_list");
  if (vcListStr) {
    const vcList = JSON.parse(vcListStr);
    const newVCList = vcList.filter(
      (_: VerifiableCredential, index: number) => {
        return index !== id;
      }
    );
    localStorage.setItem("vc_list", JSON.stringify(newVCList));
    loadData();
  }
};

const columns = [
  {
    title: "ID",
    slotName: "id",
  },
  {
    title: "发证人",
    dataIndex: "issuer",
  },
  {
    title: "发证日期",
    slotName: "issuanceDate",
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
  // dataList.value.forEach((item, index) => {
  //   if (!item.id) item.id = start + index + 1;
  // });

  total.value = vcList.value.length;

  loading.value = false;
};

const handlePageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
  loadData();
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
  const res = await axios.post(
    "http://123.60.186.80:3000/api/vc/birthday/verify",
    {
      vp,
    }
  );
  console.log(res);
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

const generateVP = async (vc: VerifiableCredential, assert: string) => {
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

  // 匿名掉VC中的生日信息
  const anonymVC = await anonymousVC(vc, assert);
  console.log(anonymVC);
  // 将VC打包成VP，发送给验证者
  const vp = await createVerifiablePresentation(did, [anonymVC], privateKey);
  // console.log(vp);
  return vp;

  // const res = await axios.post(
  //   "http://123.60.186.80:3000/api/vc/birthday_merkle/verify",
  //   {
  //     vp,
  //   }
  // );
  // if (res.status === 200) {
  //   if (res.data.verified) {
  //     Message.success(res.data.message);
  //   } else {
  //     Message.error(res.data.message);
  //   }
  // } else {
  //   Message.error("发送验证请求失败");
  // }
};
</script>

<style scoped>
#container {
  background-color: var(--color-bg-5);
  padding: 20px;
  height: 100%;
}
</style>
