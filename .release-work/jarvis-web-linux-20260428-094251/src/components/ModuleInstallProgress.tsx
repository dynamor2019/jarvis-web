'use client';

import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

interface InstallProgressProps {
  installId: string;
  pluginName: string;
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

interface ProgressState {
  status: 'downloading' | 'scanning' | 'installing' | 'completed' | 'failed';
  progress: number;
  message: string;
  securityScanResult?: {
    isSecure: boolean;
    threats: Array<{
      type: string;
      level: string;
      description: string;
      location: string;
    }>;
  };
}

export default function ModuleInstallProgress({ 
  installId, 
  pluginName, 
  onComplete, 
  onClose 
}: InstallProgressProps) {
  const [progress, setProgress] = useState<ProgressState>({
    status: 'downloading',
    progress: 0,
    message: '准备开始安装...'
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkProgress = async () => {
      try {
        const response = await fetch('/api/store/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            installId
          })
        });

        const data = await response.json();
        if (data.success) {
          setProgress({
            status: data.status,
            progress: data.progress,
            message: data.message,
            securityScanResult: data.securityScanResult
          });

          // 如果安装完成或失败，停止轮询
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(intervalId);
            setTimeout(() => {
              onComplete(data.status === 'completed');
            }, 2000);
          }
        }
      } catch (error) {
        
      }
    };

    // 立即检查一次
    checkProgress();

    // 每秒检查一次进度
    intervalId = setInterval(checkProgress, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [installId, onComplete]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'downloading':
        return '⬇️';
      case 'scanning':
        return '🔍';
      case 'installing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '🔄';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'downloading':
        return <FormattedMessage id="install.downloading" defaultMessage="正在下载" />;
      case 'scanning':
        return <FormattedMessage id="install.scanning" defaultMessage="安全扫描" />;
      case 'installing':
        return <FormattedMessage id="install.installing" defaultMessage="正在安装" />;
      case 'completed':
        return <FormattedMessage id="install.completed" defaultMessage="安装完成" />;
      case 'failed':
        return <FormattedMessage id="install.failed" defaultMessage="安装失败" />;
      default:
        return <FormattedMessage id="install.preparing" defaultMessage="准备中" />;
    }
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-[480px] max-w-[90vw]">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{getStatusIcon()}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            <FormattedMessage id="install.title" defaultMessage="正在安装模块" />
          </h2>
          <p className="text-gray-600">{pluginName}</p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
            <span className="text-sm text-gray-500">
              {progress.progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {/* 状态消息 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 text-center">
            {progress.message}
          </p>
        </div>

        {/* 安全扫描结果 */}
        {progress.securityScanResult && progress.status === 'scanning' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">🛡️</span>
              <span className="text-sm font-medium text-green-800">安全扫描结果</span>
            </div>
            {progress.securityScanResult.isSecure ? (
              <p className="text-sm text-green-700">
                ✅ 模块通过安全检查，未发现安全威胁
              </p>
            ) : (
              <div className="text-sm text-red-700">
                <p className="mb-2">⚠️ 发现以下安全问题：</p>
                <ul className="list-disc list-inside space-y-1">
                  {progress.securityScanResult.threats.map((threat, index) => (
                    <li key={index} className="text-xs">
                      <span className="font-medium">{threat.level}:</span> {threat.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 安装步骤指示器 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className={`flex items-center ${progress.progress >= 30 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${progress.progress >= 30 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-xs">下载</span>
            </div>
            <div className={`flex items-center ${progress.progress >= 50 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${progress.progress >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-xs">扫描</span>
            </div>
            <div className={`flex items-center ${progress.progress >= 70 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${progress.progress >= 70 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-xs">验证</span>
            </div>
            <div className={`flex items-center ${progress.progress >= 90 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${progress.progress >= 90 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className="text-xs">安装</span>
            </div>
            <div className={`flex items-center ${progress.progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${progress.progress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`} />
              <span className="text-xs">完成</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {progress.status === 'completed' && (
            <button
              onClick={onClose}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <FormattedMessage id="install.done" defaultMessage="完成" />
            </button>
          )}
          
          {progress.status === 'failed' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <FormattedMessage id="install.close" defaultMessage="关闭" />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <FormattedMessage id="install.retry" defaultMessage="重试" />
              </button>
            </>
          )}
          
          {(progress.status === 'downloading' || progress.status === 'scanning' || progress.status === 'installing') && (
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled
            >
              <FormattedMessage id="install.installing_wait" defaultMessage="安装中，请稍候..." />
            </button>
          )}
        </div>

        {/* 提示信息 */}
        {progress.status === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 text-center">
              <FormattedMessage 
                id="install.success_tip" 
                defaultMessage="模块安装成功！请重启 Word 以使用新功能。" 
              />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}