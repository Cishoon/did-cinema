<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <!-- <img alt="logo" src="../assets/logo.png" style="width: 33px" /> -->
        <a-typography-title
          :style="{ margin: 0, fontSize: '18px' }"
          :heading="5"
        >
          <!-- DID分布式数字身份管理系统 -->
          基于分布式数字身份的电影院售票系统
        </a-typography-title>
      </a-space>
    </div>
    <div class="right-side" style="align-items: center; margin: 20px">
      <div v-if="!didDocument || JSON.stringify(didDocument) === '{}'">
        <a-button type="outline" @click="navigateToProfile">
          未注册数字身份
        </a-button>
      </div>
      <div v-else>
        <a-tooltip :content="didDocument.id" position="bottom">
          <a-button type="outline" @click="navigateToProfile">
            已注册
          </a-button>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import router from "../router";

const didDocument = ref();
const privateKey = ref();

const navigateToProfile = () => {
  router.push("/profile");
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
});
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  height: 100%;
  background-color: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
}

.left-side {
  display: flex;
  align-items: center;
  padding-left: 20px;
}

.right-side {
  display: flex;
  padding-right: 20px;
  list-style: none;

  :deep(.locale-select) {
    border-radius: 20px;
  }
}
</style>
