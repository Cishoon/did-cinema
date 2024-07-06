<template>
  <div
    v-if="props.loading"
    style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    "
  >
    <a-spin :loading="props.loading" :size="48"></a-spin>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from "vue";

interface Props {
  loading: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  loading: () => false,
});
</script>
