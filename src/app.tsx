import React from 'react';
import {
  BasicLayoutProps,
  Settings as LayoutSettings,
} from '@ant-design/pro-layout';
import { RightContent } from '@ant-design/pro-layout/lib/components/TopNavHeader';
import Footer from '@ant-design/pro-layout/lib/Footer';
import './app.module.css';
import { useMount } from 'ahooks';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const Right2 = () => {
  useMount(() => {
    var stats = Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

    // document.body.appendChild(stats.dom);
    //统计信息显示在左上角
    stats.dom.style.cssText =
      'position:absolute;top:0px;right:0px;z-index:100000';
    document.body.appendChild(stats.dom);

    function animate() {
      stats.update();
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  });
  return <div></div>;
};
export const layout = (): BasicLayoutProps => {
  return {
    logo: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/files/icon.svg',
    siderWidth: 208,
    navTheme: 'light',

    contentStyle: {
      height: 'calc(100vh - 48px)',
    },
    headerContentRender: () => {
      return (
        <div>
          <a href="https://github.com/kitety/webgl-study" target="_blank">
            Github
          </a>
          <Right2 />
        </div>
      );
    },
  };
};
