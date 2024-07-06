<template>
  <div id="BasicLayout">
    <a-layout style="height: 100vh">
      <a-layout-header class="layout-navbar">
        <NavBar />
      </a-layout-header>
      <a-layout>
        <a-layout-sider
          collapsible
          breakpoint="xl"
          :collapsed="collapase"
          @collapse="onCollapase"
          class="layout-menu"
        >
          <MenuComponent :collapase="collapase" />
        </a-layout-sider>
        <a-layout-content
          class="layout-content"
          :style="{ paddingLeft: collapase ? '68px' : '220px' }"
        >
          <router-view />
        </a-layout-content>
      </a-layout>
      <a-layout-footer class="layout-footer">by Cishoon</a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import NavBar from "../components/NavBar.vue";
import MenuComponent from "../components/MenuComponent.vue";
import { ref } from "vue";

const collapase = ref(false);
const onCollapase = () => {
  collapase.value = !collapase.value;
};
</script>

<style scoped lang="less">
@nav-bar-height: 60px;

.layout-navbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  height: @nav-bar-height;
}

.layout-menu {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  height: 100%;
  transition: all 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
  padding-top: @nav-bar-height;
  &::after {
    position: absolute;
    top: 0;
    right: -1px;
    display: block;
    width: 1px;
    height: 100%;
    background-color: var(--color-border);
    content: "";
  }
  > :deep(.arco-layout-sider-children) {
    overflow-y: hidden;
  }
}

.layout-content {
  min-height: calc(100vh - 100px);
  overflow-y: hidden;
  background-color: var(--color-fill-2);
  transition: padding 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
  padding-top: calc(@nav-bar-height + 20px);
  padding-left: calc(200px + 20px);
  padding-right: 20px;
  padding-bottom: 20px;
}

.layout-footer {
  background-color: var(--color-fill-2);
  color: var(--color-text-3);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  padding-left: calc(200px + 20px);
  font-size: 12px;
}
</style>
