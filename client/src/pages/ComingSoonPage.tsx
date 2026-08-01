import { Card, Typography } from 'antd';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <Card>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">
        Bu bo'lim keyingi bosqichda ishlab chiqiladi.
      </Typography.Paragraph>
    </Card>
  );
}
