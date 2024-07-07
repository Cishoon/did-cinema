<template>
  <div class="scroll-box" :style="{ maxHeight: maxHeight }">
    <a-space direction="vertical">
      <!-- <h3>{{ `签发者: ${vc.issuer}` }}</h3> -->
      <a-card class="info-card" title="基本信息">
        <div class="info-content">
          <p class="info-item">{{ `类型: ${vc.type.join(", ")}` }}</p>
          <p class="info-item">{{ `签发者: ${vc.issuer}` }}</p>
          <p class="info-item">
            {{ `签发日期: ${formatDateTime(vc.issuanceDate)}` }}
          </p>
        </div>
      </a-card>
      <a-card class="info-card" title="凭证主体">
        <pre>{{ JSON.stringify(vc.credentialSubject, null, 2) }}</pre>
      </a-card>
      <a-card class="info-card" title="证明信息" v-if="vc.proof">
        <div class="info-content">
          <p class="info-item">{{ `类型: ${vc.proof.type}` }}</p>
          <p class="info-item">
            {{ `创建时间: ${formatDateTime(vc.proof.created)}` }}
          </p>
          <p class="info-item">
            {{ `验证方法: ${vc.proof.verificationMethod}` }}
          </p>
          <p class="info-item">{{ `证明目的: ${vc.proof.proofPurpose}` }}</p>
          <p class="info-item">{{ `证明值: ${vc.proof.proofValue}` }}</p>
        </div>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { VerifiableCredential } from "../utils/vc/VerifiableCredentials";
import { formatDateTime } from "../utils/utils";

const props = defineProps<{
  vc: VerifiableCredential;
  maxHeight?: string;
}>();

const vc = ref(props.vc);

watch(
  () => props.vc,
  (newVc) => {
    vc.value = newVc;
  }
);
</script>

<style scoped>
.scroll-box {
  max-height: 60vh;
  max-width: 80vw;
  overflow-y: auto;
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  background-color: #f9f9f9;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  margin: 0;
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}

.info-item::before {
  content: "• ";
  color: #1890ff;
}
</style>
