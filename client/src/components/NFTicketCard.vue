<template>
  <div>
    <a-space direction="vertical">
      <a-card class="info-card">
        <div class="info-content">
          <p class="info-item">
            {{ `过期时间: ${formatDateTime(nfticket.expirationDate)}` }}
          </p>
          <p class="info-item">{{ `NFT ID: ${nfticket.ticketId}` }}</p>
          <p class="info-item">{{ `所属用户: ${nfticket.ownerDid}` }}</p>
        </div>
        <template #extra>
          <a-button type="primary" @click="handleClick">立即观看</a-button>
        </template>
        <template #title>
          <div class="title" style="font-size: 20px; font-weight: 500">
            {{ `电影: ${nfticket.movie}` }}
          </div>
        </template>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from "../utils/utils";
import { ref, watch } from "vue";
import { NFTicket } from "../utils/NFTicket";

interface Props {
  nfticket: NFTicket;
}

const props = withDefaults(defineProps<Props>(), {
  nfticket: undefined,
});

const nfticket = ref<NFTicket>(props.nfticket);

// Emit the event to parent component
const emit = defineEmits(["watchNow"]);

const handleClick = () => {
  emit("watchNow", nfticket.value);
};

watch(
  () => props.nfticket,
  (newValue) => {
    nfticket.value = newValue;
  }
);
</script>

<style scoped>
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
.secret-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
