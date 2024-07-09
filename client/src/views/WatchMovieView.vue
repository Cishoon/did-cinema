<template>
  <div class="container">
    <div class="box">
      <p class="text">{{ title }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { signData } from "../utils/utils";
import { Message } from "@arco-design/web-vue";
import axios from "axios";

const router = useRouter();
const title = ref("正在检验NFT票据...");

onMounted(async () => {
  const keyPair = localStorage.getItem("key_pair");
  const privateKey = keyPair ? JSON.parse(keyPair).privateKey : "";
  if (!privateKey) {
    Message.error("找不到私钥");
    return;
  }

  const { params } = router.currentRoute.value;
  const ticketId = params.ticketId as string;
  const signedTicketId = await signData(ticketId, privateKey);

  const res = await axios.post("http://123.60.186.80:3000/api/movies/verify", {
    ticketId: ticketId,
    signedTicketId: signedTicketId,
  });
  if (res.status === 200) {
    if (res.data.verified) {
      title.value = res.data.title;
      Message.success(res.data.message);
    } else {
      title.value = res.data.message;
      Message.error(res.data.message);
    }
  } else {
    Message.error("发送验证请求失败");
  }
});
</script>
<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.box {
  width: 80vw; /* 16:9 aspect ratio */
  height: 45vw; /* 16:9 aspect ratio */
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text {
  color: white;
  font-size: 2em;
  font-weight: bold;
}
</style>
