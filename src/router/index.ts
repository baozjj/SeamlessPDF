import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/pdf",
    },
    {
      path: "/pdf",
      name: "pdf",
      component: () => import("@/views/PdfGenerator/index.vue"),
    },
  ],
});

export default router;
