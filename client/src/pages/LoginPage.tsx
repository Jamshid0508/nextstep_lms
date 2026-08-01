import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { brand } from '../theme/brand';

interface LoginFormValues {
  login: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.login, values.password);
      navigate('/', { replace: true });
    } catch {
      setError("Login yoki parol noto'g'ri");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at top left, ${brand.teal}22, transparent 60%), #f4f7fa`,
      }}
    >
      <Card style={{ width: 380, boxShadow: '0 12px 32px rgba(18, 59, 103, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo variant="full" size={56} />
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form<LoginFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="login"
            label="Telefon yoki email"
            rules={[{ required: true, message: 'Login kiritilishi shart' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="+998901234567" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: 'Parol kiritilishi shart' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              Kirish
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          Next Step o'quv markazi boshqaruv tizimi
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
