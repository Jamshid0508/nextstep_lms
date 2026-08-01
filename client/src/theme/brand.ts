import type { ThemeConfig } from 'antd';

export const brand = {
  blue: '#123B67',
  teal: '#178C8C',
  green: '#2ECC71',
  gradient: 'linear-gradient(135deg, #123B67 0%, #178C8C 55%, #2ECC71 100%)',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.blue,
    colorInfo: brand.teal,
    colorSuccess: brand.green,
    borderRadius: 8,
    fontFamily:
      "'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#0E2A4A',
      headerBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#0E2A4A',
      darkItemSelectedBg: brand.teal,
    },
  },
};
