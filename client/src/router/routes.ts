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
    redirect: "/cinema",
    component: BasicLayout,
    children: [
      {
        path: "cinema",
        name: "电影院",
        component: () => import("../views/MoviesView.vue"),
        meta: {
          icon: IconHome,
          hideInMenu: false,
        },
      },
      {
        path: "NFTicket",
        name: "NFT票据管理",
        component: () => import("../views/NFTicketView.vue"),
        meta: {
          icon: IconFile,
          hideInMenu: false,
        },
      },
      {
        "path": "profile",
        "name": "个人信息",
        "component": () => import("../views/ProfileView.vue"),
        "meta": {
          "icon": IconEdit,
          "hideInMenu": false,
        },
      },
      {
        path: "did",
        name: "个人DID凭证",
        component: () => import("../views/DIDView.vue"),
        meta: {
          icon: IconBookmark,
          hideInMenu: true,
        },
      },
      {
        path: "applyVC",
        name: "申请出生证明",
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
          hideInMenu: true,
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
  {
    path: "/watch/:ticketId",
    name: "观看电影",
    component: () => import("../views/WatchMovieView.vue"),
    meta: {
      icon: IconBook,
      hideInMenu: true,
    },
  }
];
