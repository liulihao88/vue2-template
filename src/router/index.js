import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true,
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true,
  },

  {
    path: '/',
    component: Layout,
    redirect: '/three',
    meta: {
      title: 'three.js',
      icon: 'dashboard',
    },
    children: [
      {
        path: 'three',
        name: 'three',
        component: () => import('@/views/three/index'),
        meta: {
          title: 'three',
        },
      },
      {
        path: 'immediate',
        name: 'immediate',
        component: () => import('@/views/three/immediate'),
        meta: {
          title: '直接加载gltf文件',
        },
      },
      {
        path: 'center',
        name: 'center',
        component: () => import('@/views/three/center'),
        meta: {
          title: '直接加载gltf文件且居中俯视展示',
        },
      },
      {
        path: 'importThree',
        name: 'importThree',
        component: () => import('@/views/three/importThree'),
        meta: {
          title: 'importThree导入glb',
        },
      },
      {
        path: 'JsonToGlb',
        name: 'JsonToGlb',
        component: () => import('@/views/three/jsonToGlb'),
        meta: {
          title: 'JsonToGlb',
        },
      },
      {
        path: 'canClickThree',
        name: 'canClickThree',
        component: () => import('@/views/three/canClickThree'),
        meta: {
          title: 'canClickThree点击glb',
        },
      },
      {
        path: 'completeThreePage',
        name: 'completeThreePage',
        component: () => import('@/views/three/completeThreePage'),
        meta: {
          title: 'completeThreePage完整页面',
        },
      },
      {
        path: 'completeThreePage2',
        name: 'completeThreePage2',
        component: () => import('@/views/three/completeThreePage2'),
        meta: {
          title: 'completeThreePage2完整页面',
        },
      },
      {
        path: 'completeThreePage3',
        name: 'completeThreePage3',
        component: () => import('@/views/three/completeThreePage3'),
        meta: {
          title: 'completeThreePage3完整页面',
        },
      },
      {
        path: 'completeThreePage4',
        name: 'completeThreePage4',
        component: () => import('@/views/three/completeThreePage4'),
        meta: {
          title: 'completeThreePage4完整页面',
        },
      },
      {
        path: 'completeThreePageWorker',
        name: 'completeThreePageWorker',
        component: () => import('@/views/three/completeThreePageWorker'),
        meta: {
          title: 'completeThreePageWorker',
        },
      },
      {
        path: 'completeThreePage6',
        name: 'completeThreePage6',
        component: () => import('@/views/three/completeThreePage6'),
        meta: {
          title: 'completeThreePage6完整页面',
        },
      },
      {
        path: 'completeThreePage7',
        name: 'completeThreePage7',
        component: () => import('@/views/three/completeThreePage7'),
        meta: {
          title: 'completeThreePage7完整页面',
        },
      },
      {
        path: 'completeThreePageNew',
        name: 'completeThreePageNew',
        component: () => import('@/views/three/completeThreePageNew'),
        meta: {
          title: 'completeThreePageNew新的完整页面',
        },
      },
      {
        path: 'testCompleteThreePage',
        name: 'testCompleteThreePage',
        component: () => import('@/views/three/testCompleteThreePage'),
        meta: {
          title: 'testCompleteThreePage测试完整页面',
        },
      },
    ],
  },

  {
    path: '/crud',
    component: Layout,
    redirect: '/crud/base',
    name: 'crud',
    meta: {
      title: 'crud',
      icon: 'el-icon-s-help',
    },
    children: [
      {
        path: 'base',
        name: 'base',
        component: () => import('@/views/crud/base'),
        meta: {
          title: 'base基础使用',
        },
      },
      {
        path: 'black',
        name: 'black',
        component: () => import('@/views/crud/black'),
        meta: {
          title: 'black黑色',
        },
      },
    ],
  },
  {
    path: '/element',
    component: Layout,
    redirect: '/element/tableBlack',
    name: 'element',
    meta: {
      title: 'element-ui',
      icon: 'el-icon-s-help',
    },
    children: [
      {
        path: 'inputBlack',
        name: 'inputBlack',
        component: () => import('@/views/element/inputBlack'),
        meta: {
          title: 'el-input黑色主题',
        },
      },
      {
        path: 'tableBlack',
        name: 'tableBlack',
        component: () => import('@/views/element/tableBlack'),
        meta: {
          title: 'el-table黑色主题',
        },
      },
      {
        path: 'selectBlack',
        name: 'selectBlack',
        component: () => import('@/views/element/selectBlack'),
        meta: {
          title: 'el-select黑色主题',
        },
      },
      {
        path: 'dialogBlack',
        name: 'dialogBlack',
        component: () => import('@/views/element/dialogBlack'),
        meta: {
          title: 'el-dialog黑色主题',
        },
      },
      {
        path: 'mergeElementComponent',
        name: 'mergeElementComponent',
        component: () => import('@/views/element/mergeElementComponent'),
        meta: {
          title: 'element-ui的组件合并使用',
        },
      },
    ],
  },
  {
    path: '/konva',
    component: Layout,
    redirect: '/konva/index',
    name: 'konva',
    meta: {
      title: 'konva',
      icon: 'el-icon-s-help',
    },
    children: [
      {
        path: 'index',
        name: 'index',
        component: () => import('@/views/konva/index'),
        meta: {
          title: 'konva基础使用',
        },
      },
      {
        path: 'draw',
        name: 'draw',
        component: () => import('@/views/konva/draw'),
        meta: {
          title: 'konva画圆圈箭头文字',
        },
      },
      {
        path: 'drawPrevNext',
        name: 'drawPrevNext',
        component: () => import('@/views/konva/drawPrevNext'),
        meta: {
          title: 'konva加上一步下一步和颜色',
        },
      },
      {
        path: 'drawRef',
        name: 'drawRef',
        component: () => import('@/views/konva/drawRef'),
        meta: {
          title: 'konva通过外部的ref传递画布',
        },
      },
    ],
  },

  {
    path: '/form',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'Form',
        component: () => import('@/views/form/threeBtn'),
        meta: {
          title: 'Form',
          icon: 'form',
        },
      },
    ],
  },

  {
    path: '/nested',
    component: Layout,
    redirect: '/nested/menu1',
    name: 'Nested',
    meta: {
      title: 'Nested',
      icon: 'nested',
    },
    children: [
      {
        path: 'menu1',
        component: () => import('@/views/nested/menu1/index'), // Parent router-view
        name: 'Menu1',
        meta: {
          title: 'Menu1',
        },
        children: [
          {
            path: 'menu1-1',
            component: () => import('@/views/nested/menu1/menu1-1'),
            name: 'Menu1-1',
            meta: {
              title: 'Menu1-1',
            },
          },
          {
            path: 'menu1-2',
            component: () => import('@/views/nested/menu1/menu1-2'),
            name: 'Menu1-2',
            meta: {
              title: 'Menu1-2',
            },
            children: [
              {
                path: 'menu1-2-1',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
                name: 'Menu1-2-1',
                meta: {
                  title: 'Menu1-2-1',
                },
              },
              {
                path: 'menu1-2-2',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
                name: 'Menu1-2-2',
                meta: {
                  title: 'Menu1-2-2',
                },
              },
            ],
          },
          {
            path: 'menu1-3',
            component: () => import('@/views/nested/menu1/menu1-3'),
            name: 'Menu1-3',
            meta: {
              title: 'Menu1-3',
            },
          },
        ],
      },
      {
        path: 'menu2',
        component: () => import('@/views/nested/menu2/index'),
        name: 'Menu2',
        meta: {
          title: 'menu2',
        },
      },
    ],
  },

  {
    path: '/t1',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 't1',
        component: () => import('@/views/test/t1'),
        meta: {
          title: 't1',
          icon: 'form',
        },
      },
    ],
  },
  {
    path: '/t2',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 't2',
        component: () => import('@/views/test/t2'),
        meta: {
          title: 't2',
          icon: 'form',
        },
      },
    ],
  },
  {
    path: '/t3',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 't3',
        component: () => import('@/views/test/t3'),
        meta: {
          title: 't3',
          icon: 'form',
        },
      },
    ],
  },
  {
    path: '/t4',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 't4',
        component: () => import('@/views/test/t4'),
        meta: {
          title: 't4',
          icon: 'form',
        },
      },
    ],
  },
  {
    path: '/t5',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 't5',
        component: () => import('@/views/test/t5'),
        meta: {
          title: 't5',
          icon: 'form',
        },
      },
    ],
  },

  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://panjiachen.github.io/vue-element-admin-site/#/',
        meta: {
          title: 'External Link',
          icon: 'link',
        },
      },
    ],
  },

  // 404 page must be placed at the end !!!
  {
    path: '*',
    redirect: '/404',
    hidden: true,
  },
]

const createRouter = () =>
  new Router({
    // mode: 'history', // require service support
    scrollBehavior: () => ({
      y: 0,
    }),
    routes: constantRoutes,
  })

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
