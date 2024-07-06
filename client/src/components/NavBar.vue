<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <!-- <img alt="logo" src="../assets/logo.png" style="width: 33px" /> -->
        <a-typography-title
          :style="{ margin: 0, fontSize: '18px' }"
          :heading="5"
        >
          DID分布式数字身份管理系统
        </a-typography-title>
      </a-space>
    </div>
    <div class="right-side" style="align-items: center; margin: 20px"></div>
  </div>
</template>

<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { useRouter } from "vue-router";
import { ref } from "vue";

const router = useRouter();
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
