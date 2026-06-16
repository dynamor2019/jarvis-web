import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// 插件配置
const getPluginConfig = async () => {
  try {
    const configPath = join(process.cwd(), 'src', 'data', 'plugin-config.json');
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('读取插件配置失败:', error);
    return {};
  }
};

export async function GET() {
  try {
    // 确定插件目录路径
    // 1. 优先使用环境变量
    // 2. 其次尝试当前目录下的 plugins 文件夹 (部署模式)
    // 3. 最后回退到开发环境路径
    let modulesPath = process.env.JARVIS_PLUGIN_DIR;
    
    if (!modulesPath) {
      const deployPath = join(process.cwd(), 'plugins');
      try {
        await readdir(deployPath);
        modulesPath = deployPath;
      } catch {
        modulesPath = join(process.cwd(), '..', 'Jarvis', 'Modules');
      }
    }
    
    
    const files = await readdir(modulesPath);
    const jarvFiles = files.filter(file => file.endsWith('.jarv'));
    
    // 读取插件配置
    const pluginConfig = await getPluginConfig();

    const plugins = [];

    for (const file of jarvFiles) {
      try {
        const filePath = join(modulesPath, file);
        const content = await readFile(filePath, 'utf-8');
        
        // 解析 jarv 文件的元数据
        const metadata = parseJarvMetadata(content);
        const pluginId = file.replace('.jarv', '');
        const config = pluginConfig[pluginId] || {};
        
        plugins.push({
          id: pluginId,
          name: metadata.name || pluginId,
          version: metadata.version || '1.0.0',
          price: config.price || 0,
          description: metadata.description || '暂无描述',
          author: metadata.author || 'Jarvis',
          group: metadata.group || config.category || '工具',
          icon: metadata.icon || '🔧',
          featured: config.featured || false,
          downloads: Math.floor(Math.random() * 1000) + 100, // 模拟下载数
          rating: 4.5 + Math.random() * 0.5, // 模拟评分
          features: [
            metadata.description || '功能描述',
            '集成到右键菜单',
            '一键执行操作',
            '支持批量处理'
          ],
          fileSize: `${Math.floor(content.length / 1024)} KB`,
          lastUpdated: '2024-01-15',
          compatibility: ['Word 2016+', 'Word 365'],
          tags: [metadata.group || config.category || '工具', '效率', 'Word']
        });
      } catch (fileError) {
        console.error(`解析文件失败: ${file}`, fileError);
      }
    }

    // 按特色和名称排序
    const sortedPlugins = plugins.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      plugins: sortedPlugins
    });
  } catch (error) {
    console.error('获取插件列表错误:', error);
    return NextResponse.json(
      { success: false, error: '获取插件列表失败' },
      { status: 500 }
    );
  }
}

function parseJarvMetadata(content: string) {
  const metadata: any = {};
  
  // 解析注释中的元数据
  const lines = content.split('\n');
  let inMetadata = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '// Metadata:') {
      inMetadata = true;
      continue;
    }
    
    if (inMetadata && trimmed.startsWith('//')) {
      if (trimmed === '//') {
        inMetadata = false;
        break;
      }
      
      const metaLine = trimmed.substring(2).trim();
      const colonIndex = metaLine.indexOf(':');
      
      if (colonIndex > 0) {
        const key = metaLine.substring(0, colonIndex).trim().toLowerCase();
        const value = metaLine.substring(colonIndex + 1).trim();
        metadata[key] = value;
      }
    } else if (inMetadata) {
      break;
    }
  }
  
  return metadata;
}