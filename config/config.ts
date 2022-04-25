import { defineConfig } from 'umi';
import routes from './route';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  layout: {
    name: 'Webgl Demo',
    routes,
  },
  mfsu: {},
  routes,
  fastRefresh: {},
  webpack5: {},
  publicPath: 'https://kitety.github.io/webgl-study/',
  base: '/webgl-study/',
});
