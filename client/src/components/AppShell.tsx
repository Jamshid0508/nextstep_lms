import { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Popover,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  LeftOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { getNavForRole } from '../config/nav';
import { apiClient } from '../api/client';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  // Mobile detection: screen smaller than md (768px)
  const isMobile = !screens.md;

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    apiClient
      .get<{ success: true; data: NotificationItem[] }>('/student/notifications')
      .then(({ data }) => {
        const list = data.data ?? [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }, [user, location.pathname]);

  if (!user) return null;

  const navItems = getNavForRole(user.role);

  const userMenu: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 8px' }}>
          <Typography.Text strong style={{ display: 'block' }}>{user.fullName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user.role}</Typography.Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      onClick: () => {
        logout().then(() => navigate('/login'));
      },
    },
  ];

  const notificationContent = (
    <div style={{ width: 300, maxHeight: 360, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Typography.Text strong>Bildirishnomalar</Typography.Text>
        {unreadCount > 0 && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{unreadCount} ta o'qilmagan</Typography.Text>}
      </div>
      {notifications.length === 0 ? (
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '16px 0' }}>
          Bildirishnomalar mavjud emas
        </Typography.Text>
      ) : (
        notifications.slice(0, 5).map((n) => (
          <div key={n._id} style={{ padding: '8px 0', borderBottom: '1px dashed #f0f0f0' }}>
            <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>{n.title}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{n.message}</Typography.Text>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="dark"
          width={240}
          className="custom-sider"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div>
            <div
              style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Logo variant={collapsed ? 'icon' : 'full'} size={collapsed ? 32 : 34} theme="dark" />
            </div>
            <Menu
              theme="dark"
              mode="inline"
              className="custom-sidebar-menu"
              selectedKeys={[location.pathname]}
              items={navItems}
              onClick={({ key }) => navigate(key)}
            />
          </div>
        </Sider>
      )}

      {/* Mobile Drawer Navigation */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          bodyStyle={{ padding: 0, background: '#0A192F' }}
          headerStyle={{ background: '#0A192F', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
          title={<Logo variant="full" size={32} theme="dark" />}
          width={260}
        >
          <Menu
            theme="dark"
            mode="inline"
            className="custom-sidebar-menu"
            selectedKeys={[location.pathname]}
            items={navItems}
            onClick={({ key }) => {
              navigate(key);
              setDrawerOpen(false);
            }}
          />
        </Drawer>
      )}

      <Layout>
        {/* Glassmorphism Header */}
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInline: isMobile ? 16 : 24,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(255, 255, 255, 0.85)',
            borderBottom: '1px solid #E2E8F0',
            height: 64,
          }}
        >
          {/* Left Header section: Interactive Sidebar Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile ? (
              <Button
                type="text"
                className="sidebar-toggle-btn"
                icon={<MenuUnfoldOutlined className="sidebar-toggle-icon" style={{ fontSize: 18 }} />}
                onClick={() => setDrawerOpen(true)}
              />
            ) : (
              <Tooltip title={collapsed ? "Menyuni yoyish" : "Menyuni yig'ish"} placement="right">
                <Button
                  type="text"
                  className="sidebar-toggle-btn"
                  icon={
                    collapsed ? (
                      <RightOutlined className="sidebar-toggle-icon" style={{ fontSize: 14 }} />
                    ) : (
                      <LeftOutlined className="sidebar-toggle-icon" style={{ fontSize: 14 }} />
                    )
                  }
                  onClick={() => setCollapsed(!collapsed)}
                />
              </Tooltip>
            )}
          </div>

          {/* Right Header section: Notifications & Profile Avatar */}
          <Space size={isMobile ? 'middle' : 'large'}>
            <Popover content={notificationContent} trigger="click" placement="bottomRight">
              <Badge count={unreadCount} overflowCount={99} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#64748B' }} />}
                />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#123B67' }} icon={<UserOutlined />}>
                  {user.fullName?.substring(0, 2).toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <Typography.Text strong style={{ color: '#1E293B' }}>
                    {user.fullName}
                  </Typography.Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Area */}
        <Content style={{ margin: isMobile ? 12 : 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
