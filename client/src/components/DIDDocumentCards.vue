<template>
    <div>
        
    <a-space direction="vertical">
        <h3>{{ `DID: ${didDocument.id}` }}</h3>
        <a-card class="info-card" title="基本信息">
            <!-- 版本、签名算法、更新时间和创建时间 -->
            <div class="info-content">
            <p class="info-item">{{ `版本: ${didDocument.versionId}` }}</p>
            <p class="info-item">{{ `更新时间: ${formatDateTime(didDocument.updated)}` }}</p>
            <p class="info-item">{{ `创建时间: ${formatDateTime(didDocument.created)}` }}</p>
            </div>
        </a-card>

        <a-card class="info-card" title="验证方法">
            <!-- 公钥信息 -->
            <div class="info-content">
            <p class="info-item">
                {{ `公钥ID: ${didDocument.verificationMethod[0].id}` }}
            </p>

            <p class="info-item">
                {{ `公钥算法: ${didDocument.verificationMethod[0].type}` }}
            </p>
            <p class="info-item">
                {{ `控制者: ${didDocument.verificationMethod[0].controller}` }}
            </p>

            <p class="info-item">
                {{
                `公钥: ${didDocument.verificationMethod[0].publicKeyMultibase}`
                }}
            </p>

            <div class="secret-container" v-if="privateKey">
                <p class="info-item">
                {{
                    "私钥: " +
                    (secretVisible
                    ? privateKey
                    : "************************************************************************")
                }}
                </p>
                <div @click="toggleSecretVisible" style="cursor: pointer;">
                    <IconEye v-if="!secretVisible"></IconEye>
                    <IconEyeInvisible v-else=></IconEyeInvisible>
                </div>
            </div>
            </div>
        </a-card>
    </a-space>
    </div>
    
</template>

<script setup lang="ts">
import { formatDateTime } from "../utils/utils";
import { IconEye, IconEyeInvisible } from "@arco-design/web-vue/es/icon";
import { ref } from "vue";

interface Props {
    didDocument: any;
    privateKey: string;
}

const props = withDefaults(defineProps<Props>(), {
    didDocument: {},
    privateKey: "",
});

const didDocument = ref(props.didDocument);
const privateKey = ref(props.privateKey);

const secretVisible = ref(false);
// 获取组件参数，didDocument和privateKey

const toggleSecretVisible = () => {
    secretVisible.value = !secretVisible.value;
};

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
