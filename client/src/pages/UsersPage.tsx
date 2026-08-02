import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Upload, message, Space, Tabs } from 'antd';
import type { FormInstance } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { CrudPage } from '../components/crm/CrudPage';
import { apiClient } from '../api/client';

interface BranchInfo {
  _id: string;
  name: string;
}

interface UserRecord {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  status: 'active' | 'blocked' | 'pending';
  studentType?: 'restricted' | 'paid';
  branchId?: BranchInfo | string;
}

interface ReferenceData {
  branches: BranchInfo[];
}

export function UsersPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [branches, setBranches] = useState<BranchInfo[]>([]);

  useEffect(() => {
    apiClient
      .get<{ success: true; data: ReferenceData }>('/superadmin/references')
      .then(({ data }) => setBranches(data.data?.branches ?? []))
      .catch(() => setBranches([]));
  }, []);

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<{ success: true; data: { importedCount: number; errors: string[] } }>(
        '/superadmin/users/import',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (data.data.errors.length > 0) {
        message.warning(`Fayl import qilindi, ammo ${data.data.errors.length} qatorda xatolik bor`);
      } else {
        message.success(`${data.data.importedCount} ta foydalanuvchi import qilindi`);
      }

      setReloadKey((prev) => prev + 1);
    } catch {
      message.error('Excel faylini import qilishda xatolik yuz berdi');
    }
  };

  const handleSetPaid = async (id: string) => {
    try {
      await apiClient.patch(`/superadmin/users/${id}`, { studentType: 'paid' });
      message.success('Talaba pulli qilib belgilandi');
      setReloadKey((prev) => prev + 1);
    } catch {
      message.error('Talabani pulli qilib belgilashda xatolik yuz berdi');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/superadmin/users/export?role=STUDENT', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Barcha o‘quvchilarni export qilishda xatolik yuz berdi');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/superadmin/users/import/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Import shablonini yuklab olishda xatolik yuz berdi');
    }
  };

  const [activeRole, setActiveRole] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'>('ALL');

  const roleOptions = [
    { key: 'ALL', label: 'Barchasi' },
    { key: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
    { key: 'ADMIN', label: 'ADMIN' },
    { key: 'TEACHER', label: 'O‘qituvchilar' },
    { key: 'STUDENT', label: 'O‘quvchilar' },
    { key: 'PARENT', label: 'Ota-onalar' },
  ];

  const filteredEndpoint = activeRole === 'ALL' ? `/superadmin/users?refresh=${reloadKey}` : `/superadmin/users?role=${activeRole}&refresh=${reloadKey}`;

  const renderForm = (_form: FormInstance) => (
    <>
      <Form.Item name="fullName" label="F.I.Sh" rules={[{ required: true, message: 'F.I.Sh kiriting' }]}>
        <Input />
      </Form.Item>

      <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: 'Telefon kiriting' }]}>
        <Input />
      </Form.Item>

      <Form.Item name="email" label="Email">
        <Input />
      </Form.Item>

      <Form.Item name="role" label="Rol" rules={[{ required: true, message: 'Rol tanlang' }]}>
        <Select
          options={[
            { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Barcha filiallar)' },
            { value: 'ADMIN', label: 'ADMIN (Filial admini)' },
            { value: 'TEACHER', label: 'OʻQITUVCHI' },
            { value: 'STUDENT', label: 'TALABA' },
            { value: 'PARENT', label: 'OTA-ONA' },
          ]}
        />
      </Form.Item>

      <Form.Item
        shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
        noStyle
      >
        {({ getFieldValue }) => {
          const selectedRole = getFieldValue('role');
          const isRequired = selectedRole === 'ADMIN';
          return (
            <Form.Item
              name="branchId"
              label="Biriktirilgan Filial"
              rules={isRequired ? [{ required: true, message: 'Filialni tanlang' }] : undefined}
            >
              <Select
                placeholder="Filialni tanlang"
                options={branches.map((b) => ({ value: b._id, label: b.name }))}
                allowClear
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role} noStyle>
        {({ getFieldValue }) =>
          getFieldValue('role') === 'STUDENT' ? (
            <Form.Item name="studentType" label="Talaba turi" initialValue="restricted">
              <Select
                options={[
                  { value: 'restricted', label: 'Restr' },
                  { value: 'paid', label: 'Pulli' },
                ]}
              />
            </Form.Item>
          ) : null
        }
      </Form.Item>

      <Form.Item name="password" label="Parol" rules={[{ required: true, message: 'Parol kiriting' }]}>
        <Input.Password />
      </Form.Item>

      <Form.Item name="status" label="Holat" initialValue="active">
        <Select
          options={[
            { value: 'active', label: 'Faol' },
            { value: 'blocked', label: 'Bloklangan' },
            { value: 'pending', label: 'Kutilmoqda' },
          ]}
        />
      </Form.Item>
    </>
  );

  const columns = [
    { title: 'F.I.Sh', dataIndex: 'fullName' as const },
    { title: 'Telefon', dataIndex: 'phone' as const },
    { title: 'Email', dataIndex: 'email' as const },
    { title: 'Rol', dataIndex: 'role' as const },
    {
      title: 'Filial',
      dataIndex: 'branchId' as const,
      render: (value: unknown) => (value as BranchInfo)?.name ?? '-',
    },
    {
      title: 'Talaba turi',
      dataIndex: 'studentType' as const,
      render: (value: unknown, record: UserRecord) => {
        if (record.role !== 'STUDENT') {
          return null;
        }

        return (
          <Space size="small">
            <span>{String(value) === 'paid' ? 'Pulli' : 'Restr'}</span>
            {String(value) !== 'paid' ? (
              <Button type="link" size="small" onClick={() => handleSetPaid(record._id)}>
                Pulliga o‘tkazish
              </Button>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Holat',
      dataIndex: 'status' as const,
      render: (value: unknown) => {
        const v = String(value);
        const labels: Record<string, string> = { active: 'Faol', blocked: 'Bloklangan', pending: 'Kutilmoqda', suspended: 'Muzlatilgan' };
        return <span>{labels[v] ?? v}</span>;
      },
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeRole}
        onChange={(key) => setActiveRole(key as typeof activeRole)}
        items={roleOptions.map((role) => ({
          key: role.key,
          label: role.label,
          children: (
            <CrudPage<UserRecord>
              title="Foydalanuvchilar"
              endpoint={filteredEndpoint}
              columns={columns}
              formItems={renderForm}
              extra={
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                    Import shablonini yuklab olish
                  </Button>
                  <Upload beforeUpload={(file) => { void handleImport(file); return false; }} accept=".xlsx,.xls" maxCount={1} showUploadList={false}>
                    <Button icon={<UploadOutlined />}>Excel import</Button>
                  </Upload>
                  <Button icon={<DownloadOutlined />} onClick={handleExport}>
                    Barcha o‘quvchilarni export
                  </Button>
                </Space>
              }
            />
          ),
        }))}
      />
    </div>
  );
}
