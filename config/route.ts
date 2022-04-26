import { IBestAFSRoute } from '@umijs/plugin-layout';

const routes: IBestAFSRoute[] = [
  {
    path: '/',
    component: '@/pages/01',
    name: '01裁剪空间坐标',
  },
  {
    path: '/02',
    component: '@/pages/02',
    name: '02像素坐标',
  },
  {
    path: '/03',
    component: '@/pages/03',
    name: '03生成矩形',
  },
  {
    path: '/04',
    component: '@/pages/04',
    name: '04移动',
  },
  {
    path: '/05',
    component: '@/pages/05',
    name: '05 F',
  },
];
export default routes;
