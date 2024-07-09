<template>
  <div id="container">
    <a-space>
      <a-page-header title="NFT票据管理" :show-back="false" />
      <!-- <a-button @click="syncNFTicket">同步数据</a-button> -->
    </a-space>
    <a-list
      class="list-demo-action-layout"
      :bordered="false"
      :data="NFTicketList"
      :pagination-props="paginationProps"
    >
      <template #item="{ item }">
        <div style="padding: 20px">
          <NFTicketCard
            :nfticket="item"
            @watchNow="handleWatchNow(item)"
          ></NFTicketCard>
        </div>
      </template>
    </a-list>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from "vue";
import { NFTicket, NFTicketManager } from "../utils/NFTicket";
import NFTicketCard from "../components/NFTicketCard.vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { Message } from "@arco-design/web-vue";

const router = useRouter();

const NFTicketList = ref<NFTicket[]>([]);
const paginationProps = reactive({
  defaultPageSize: 3,
  total: 0,
});

const syncNFTicket = async () => {
  const didDocument = localStorage.getItem("did_document");
  if (!didDocument) {
    Message.error("请先到“个人信息”页面注册数字身份");
    return;
  }
  const did = JSON.parse(didDocument).id;

  const res = await axios.post("http://123.60.186.80:3000/api/sync/nfticket", {
    ownerDid: did,
  });
  if (res.status === 200) {
    console.log(res);
  }
};

const fetchNFTickets = async () => {
  NFTicketList.value = (await NFTicketManager.getNFTicketsAsync()).map(
    (nfticket) => JSON.parse(nfticket)
  );
  paginationProps.total = NFTicketList.value.length;
  console.log(NFTicketList.value);
};

onMounted(async () => {
  await fetchNFTickets();
});

const handleWatchNow = async (item: NFTicket) => {
  console.log(item);
  router.push("/watch/" + item.ticketId);
};
</script>

<style scoped>
#container {
  background-color: var(--color-bg-5);
  padding: 20px;
  height: 100%;
}
.list-demo-action-layout .image-area {
  width: 200px;
  height: 200px;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.list-demo-action-layout .image-area img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 0 auto;
}

.list-demo-action-layout .list-demo-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--color-fill-3);
}

.list-demo-action-layout .arco-list-item-action .arco-icon {
  margin: 0 4px;
}
</style>
