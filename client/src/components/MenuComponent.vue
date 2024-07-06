<template>
  <div class="menu">
    <a-menu
      :style="{ width: '200px', height: '100%' }"
      :selected-keys="selectedKeys"
      breakpoint="xl"
      :collapsed="props.collapase"
      @menu-item-click="clickMenu"
    >
      <a-menu-item v-for="item in visibleRoutes" :key="'/' + item.path">
        <template #icon>
          <component :is="item.meta?.icon ?? IconList"></component>
        </template>
        {{ item.name }}
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup lang="ts">
import { routes } from "../router/routes";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { IconList } from "@arco-design/web-vue/es/icon";

interface Props {
  collapase: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapase: () => false,
});
const router = useRouter();

const homeRouter = routes.find((item) => item.path === "/");
const homeRouterChildren = homeRouter?.children;

const visibleRoutes = homeRouterChildren?.filter((item) => {
  if (item.meta?.hideInMenu) {
    return false;
  } else return true;
});

// 默认选中的路由
let currentPath = router.currentRoute.value.fullPath;
let selectedKeys = ref([currentPath]);

const clickMenu = (path: string) => {
  router.push({
    path: path,
  });
};

router.afterEach((to) => {
  selectedKeys.value = [to.path];
});
</script>

<style scoped></style>
