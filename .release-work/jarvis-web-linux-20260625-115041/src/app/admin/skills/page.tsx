'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SkillItem = {
  id?: string;
  name: string;
  nameEn?: string;
  url: string;
  description: string;
  descriptionEn?: string;
};

const EMPTY_SKILL: SkillItem = {
  name: '',
  nameEn: '',
  url: '',
  description: '',
  descriptionEn: ''
};

export default function AdminSkillsPage() {
  const router = useRouter();
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await fetch('/api/admin/skills', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }
        setItems(Array.isArray(payload.skills) ? payload.skills : []);
      } catch (error: any) {
        alert(`加载失败: ${error?.message || 'unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  const updateItem = (index: number, patch: Partial<SkillItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_SKILL }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const cloned = [...prev];
      const temp = cloned[index];
      cloned[index] = cloned[nextIndex];
      cloned[nextIndex] = temp;
      return cloned;
    });
  };

  const saveAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skills: items })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      setItems(Array.isArray(payload.skills) ? payload.skills : []);
      alert('保存成功');
    } catch (error: any) {
      alert(`保存失败: ${error?.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Skill 内容管理</h1>
            <p className="text-sm text-gray-600 mt-1">维护名称、地址、简介后，商店“天赋点亮”标签会自动展示。</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" prefetch={false} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
              返回后台
            </Link>
            <button
              onClick={saveAll}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存内容'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.id || 'skill'}-${index}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Skill 名称"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  value={item.nameEn || ''}
                  onChange={(e) => updateItem(index, { nameEn: e.target.value })}
                  placeholder="Skill Name (English)"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  value={item.url}
                  onChange={(e) => updateItem(index, { url: e.target.value })}
                  placeholder="Skill 地址（GitHub URL）"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Skill 简介（中文）"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  value={item.descriptionEn || ''}
                  onChange={(e) => updateItem(index, { descriptionEn: e.target.value })}
                  placeholder="Skill 简介（English）"
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-3 flex justify-end gap-4">
                <button onClick={() => moveItem(index, -1)} className="text-sm text-gray-600 hover:text-gray-800">
                  上移
                </button>
                <button onClick={() => moveItem(index, 1)} className="text-sm text-gray-600 hover:text-gray-800">
                  下移
                </button>
                <button onClick={() => removeItem(index)} className="text-sm text-red-600 hover:text-red-700">
                  删除
                </button>
              </div>
            </div>
          ))}
          <button onClick={addItem} className="w-full py-3 rounded-lg border border-dashed border-gray-300 text-gray-700 hover:bg-gray-100">
            + 新增 Skill 卡片
          </button>
        </div>
      </div>
    </div>
  );
}
