import type { ThemeConfig } from 'antd';

export const brand = {
  blue: '#123B67',
  teal: '#178C8C',
  green: '#2ECC71',
  slateBg: '#F8FAFC',
  textDark: '#1E293B',
  textMuted: '#64748B',
  gradient: 'linear-gradient(135deg, #123B67 0%, #178C8C 55%, #2ECC71 100%)',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.blue,
    colorInfo: brand.teal,
    colorSuccess: brand.green,
    colorBgLayout: brand.slateBg,
    colorBgContainer: '#FFFFFF',
    colorText: brand.textDark,
    colorTextSecondary: brand.textMuted,
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#0F2744',
      headerBg: 'rgba(255, 255, 255, 0.85)',
      bodyBg: brand.slateBg,
    },
    Menu: {
      darkItemBg: '#0F2744',
      darkItemSelectedBg: brand.teal,
      darkItemColor: '#94A3B8',
      darkItemSelectedColor: '#FFFFFF',
    },
    Card: {
      colorBorderSecondary: '#E2E8F0',
    },
    Table: {
      headerBg: '#F1F5F9',
      headerColor: '#475569',
      rowHoverBg: '#F8FAFC',
    },
  },
};
