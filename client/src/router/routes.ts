import { RouteRecordRaw } from "vue-router";
import BasicLayout from "../layouts/BasicLayout.vue";
import { Message } from "@arco-design/web-vue";
import
{
  IconBook,
  IconBookmark,
  IconBrush,
  IconCode,
  IconEdit,
  IconFile,
  IconFontColors,
  IconHome,
  IconList,
  IconSafe,
} from "@arco-design/web-vue/es/icon";

/**
 * 关于access权限：
 *    如果任何人都可以访问，设置
 */
export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/did",
    component: BasicLayout,
    children: [
      {
        path: "did",
        name: "个人DID凭证",
        component: () => import("../views/DIDView.vue"),
        meta: {
          icon: IconBookmark,
          hideInMenu: false,
        },
      },
      {
        path: "applyVC",
        name: "申请VC",
        component: () => import("../views/VCView.vue"),
        meta: {
          icon: IconSafe,
          hideInMenu: false,
        },
      },
      {
        path: "manageVC",
        name: "管理VC",
        component: () => import("../views/VCManageView.vue"),
        meta: {
          icon: IconList,
          hideInMenu: false,
        },
      },
    ]
  },
  {
    path: "/exception",
    meta: {
      hideInMenu: true,
    },
    children: [
      {
        path: "403",
        component: () => import("../views/exception/NoAuth.vue"),
      },
    ],
  },
];
