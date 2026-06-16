import { Metadata } from 'next';
import DocsContent from '@/components/DocsContent';

export const metadata: Metadata = {
  title: '\u667A\u80FD\u4F53\u4F7F\u7528\u8BF4\u660E - \u5C0F\u8D3EAI',
  description: '\u8BE6\u7EC6\u7684\u5C0F\u8D3EAI Word AI\u667A\u80FD\u4F53\u4F7F\u7528\u6307\u5357\u548C\u529F\u80FD\u8BF4\u660E',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DocsContent />
    </div>
  );
}