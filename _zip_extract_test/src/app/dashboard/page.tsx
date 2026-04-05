// [CodeGuard Feature Index]
// - handleLogout -> line 182
// - fetchBalance -> line 287
// - onUpdated -> line 321
// - formatAmount -> line 344
// - isChinaRegion -> line 537
// - handleSave -> line 555
// - SecurityTab -> line 886
// - SubscriptionTab -> line 984
// [/CodeGuard Feature Index]

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import ReferralCard from '@/components/ReferralCard';
import ProMonolineIcon from '@/components/ProMonolineIcon';

interface User {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: string;
    tokenBalance: number | null;
    balance: number;
    totalSpent: number;
    phone: string | null;
    licenseType: string;
    subscriptionEnd: string | null;
    preferredLanguage: string;
    timezone: string;
    age: number | null;
    gender: string | null;
    profession: string | null;
    industry: string | null;
    education: string | null;
    school: string | null;
    country: string | null;
    province: string | null;
    city: string | null;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    createdAt: string;
}

export default function Dashboard() {
    const router = useRouter();
    const intl = useIntl();
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchUserData = useCallback(async (token: string) => {
        try {
            const response = await fetch('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch user');
            
            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            
            // Only redirect if we haven't already
            if (localStorage.getItem('token')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchTransactions = useCallback(async (token: string) => {
        try {
            const response = await fetch('/api/transactions?limit=10', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (response.status === 401) return;

            if (!response.ok) throw new Error('Failed to fetch transactions');
            
            const data = await response.json();
            setTransactions(data.transactions);
        } catch (error) {
            
        }
    }, []);

    const syncAdViews = useCallback(async (token: string) => {
        try {
            // 从C#本地文件读取广告观看数据
            const localResponse = await fetch('/api/tokens/local-ad-views', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!localResponse.ok) {
                
                return;
            }

            const localData = await localResponse.json();
            const adViews = localData.adViews || [];

            if (!Array.isArray(adViews) || adViews.length === 0) {
                
                return;
            }

            

            // 同步到后台
            const response = await fetch('/api/tokens/sync-ad-views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ adViews })
            });

            if (response.ok) {
                const data = await response.json();
                
                
                // 显示获得tokens的提示，说明总数在下次登录后更新
                if (data.totalTokens > 0) {
                    const message = intl.formatMessage({ id: 'dashboard.msg.ad_reward', defaultMessage: '感谢观看广告！💎 +{tokens} Tokens 已奉送\nTokens总数在下次登录后更新' }, { tokens: data.totalTokens });
                    alert(message);
                }
                
                // 获取web端的收入统计
                const incomeResponse = await fetch('/api/tokens/income', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });

                if (incomeResponse.ok) {
                    const incomeData = await incomeResponse.json();
                    
                    if (incomeData?.success) {
                        
                    }
                }
            }
        } catch (error) {
            
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // 同步本地广告观看数据
        syncAdViews(token);
        
        fetchUserData(token);
        fetchTransactions(token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl"><FormattedMessage id="common.loading" defaultMessage="加载中..." /></div>
            </div>
        );
    }

    if (!user) return null;

    const tabs = [
        { id: 'overview', name: intl.formatMessage({ id: 'dashboard.tabs.overview', defaultMessage: '概览' }), icon: '📊' },
        { id: 'profile', name: intl.formatMessage({ id: 'dashboard.tabs.profile', defaultMessage: '个人资料' }), icon: '👤' },
        { id: 'security', name: intl.formatMessage({ id: 'dashboard.tabs.security', defaultMessage: '账户安全' }), icon: '🔒' },
        {
            id: 'subscription',
            name: intl.formatMessage({ id: 'dashboard.tabs.subscription', defaultMessage: '订阅管理' }),
            icon: <ProMonolineIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                                <FormattedMessage id="dashboard.welcome" defaultMessage="欢迎回来" />, <span className="gradient-text">{user.name || user.username}</span>
                                {user.role === 'admin' && (
                                    <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                        👑 <FormattedMessage id="dashboard.role.admin" defaultMessage="管理员" />
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-600"><FormattedMessage id="dashboard.subtitle" defaultMessage="管理你的账户和设置" /></p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/support" prefetch={false} className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors">
                                联系管理员
                            </Link>
                            {user.role === 'admin' && (
                                <Link href="/admin" prefetch={false} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    👑 <FormattedMessage id="dashboard.admin" defaultMessage="管理后台" />
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FormattedMessage id="dashboard.logout" defaultMessage="退出登录" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Tabs */}
                <div className="mb-8 border-b">
                    <nav className="flex gap-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-indigo-600 text-indigo-600 font-medium'
                                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="text-xl">{tab.icon}</span>
                                        {tab.id === 'overview' && <FormattedMessage id="dashboard.tabs.overview" defaultMessage="概览" />}
                                        {tab.id === 'profile' && <FormattedMessage id="dashboard.tabs.profile" defaultMessage="个人资料" />}
                                        {tab.id === 'security' && <FormattedMessage id="dashboard.tabs.security" defaultMessage="账户安全" />}
                                        {tab.id === 'subscription' && <FormattedMessage id="dashboard.tabs.subscription" defaultMessage="订阅管理" />}
                                    </button>
                                ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && <OverviewTab user={user} transactions={transactions} />}
                {activeTab === 'profile' && <ProfileTab user={user} onUpdate={fetchUserData} />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'subscription' && <SubscriptionTab user={user} />}
            </div>
        </div>
    );
}

// 概览标签
function OverviewTab({ user, transactions }: { user: User; transactions: Transaction[] }) {
    const [tokenBalance, setTokenBalance] = useState<number | null>(null)
    const [trafficBalance, setTrafficBalance] = useState<number | null>(null)
    const [subscriptionBalance, setSubscriptionBalance] = useState<number | null>(null)
    const [income, setIncome] = useState<{ adView: number; referral: number; total: number } | null>(null)
    
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const bearer = localStorage.getItem('token')
                if (!bearer) return
                const r = await fetch('/api/tokens/balance', { headers: { 'Authorization': `Bearer ${bearer}` } })
                const j = await r.json()
                if (j?.success) {
                    const nextTraffic =
                        typeof j.trafficBalance === 'number'
                            ? j.trafficBalance
                            : (typeof j.trafficTokenBalance === 'number' ? j.trafficTokenBalance : null)
                    const nextSubscription =
                        typeof j.subscriptionBalance === 'number'
                            ? j.subscriptionBalance
                            : (typeof j.subscriptionTokenBalance === 'number' ? j.subscriptionTokenBalance : null)
                    const nextToken =
                        typeof j.tokenBalance === 'number'
                            ? j.tokenBalance
                            : (
                                nextTraffic !== null && nextSubscription !== null
                                    ? nextTraffic + nextSubscription
                                    : null
                              )
                    setTokenBalance(nextToken)
                    setTrafficBalance(nextTraffic)
                    setSubscriptionBalance(nextSubscription)
                } else {
                    setTokenBalance(null)
                    setTrafficBalance(null)
                    setSubscriptionBalance(null)
                }
            } catch {}
        }
        fetchBalance()
        const onUpdated = () => {
            fetchBalance()
        }
        window.addEventListener('jarvis-token-updated', onUpdated as EventListener)
        return () => window.removeEventListener('jarvis-token-updated', onUpdated as EventListener)
    }, [])

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const bearer = localStorage.getItem('token')
                if (!bearer) return
                const r = await fetch('/api/tokens/income', { headers: { 'Authorization': `Bearer ${bearer}` } })
                const j = await r.json()
                if (j?.success && j.income) setIncome(j.income)
                else setIncome(null)
            } catch {}
        }
        fetchIncome()
    }, [])

    const currentTokenBalance =
        tokenBalance ?? (typeof user.tokenBalance === 'number' ? user.tokenBalance : null)
    const formatAmount = (value: number | null) => (value === null ? '--' : value.toLocaleString())

    return (
        <div className="space-y-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="dashboard.stats.balance" defaultMessage="账户余额" /></div>
                    <div className="text-4xl font-bold text-[#4F46E5]">¥{user.balance.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="dashboard.stats.spent" defaultMessage="累计消费" /></div>
                    <div className="text-4xl font-bold text-[#EC4899]">¥{user.totalSpent.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="dashboard.stats.transactions" defaultMessage="交易记录" /></div>
                    <div className="text-4xl font-bold text-[#06B6D4]">{transactions.length}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="dashboard.stats.token_balance" defaultMessage="Token 余额" /></div>
                    <div className="text-3xl font-bold text-green-600">{formatAmount(currentTokenBalance)}</div>
                    <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-center justify-between text-blue-700">
                            <span><FormattedMessage id="dashboard.stats.traffic_balance" defaultMessage="流量余额" /></span>
                            <span className="font-semibold">{formatAmount(trafficBalance)}</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-700">
                            <span><FormattedMessage id="dashboard.stats.subscription_balance" defaultMessage="订阅余额" /></span>
                            <span className="font-semibold">{formatAmount(subscriptionBalance)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-gray-600 text-sm mb-2"><FormattedMessage id="dashboard.stats.status" defaultMessage="账户状态" /></div>
                    <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        <FormattedMessage id="dashboard.stats.status.normal" defaultMessage="正常" />
                    </div>
                </div>
            </div>

            {/* 已获Token统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-600 text-sm"><FormattedMessage id="dashboard.income.ad_view" defaultMessage="观看广告收入" /></div>
                        <span className="text-2xl">📺</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{formatAmount(income?.adView ?? null)}</div>
                    <div className="text-xs text-blue-500 mt-2"><FormattedMessage id="dashboard.income.ad_view_desc" defaultMessage="通过观看广告获得" /></div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-600 text-sm"><FormattedMessage id="dashboard.income.referral" defaultMessage="推荐收入" /></div>
                        <span className="text-2xl">👥</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{formatAmount(income?.referral ?? null)}</div>
                    <div className="text-xs text-purple-500 mt-2"><FormattedMessage id="dashboard.income.referral_desc" defaultMessage="通过推荐获得" /></div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-gray-600 text-sm"><FormattedMessage id="dashboard.income.total" defaultMessage="总收入" /></div>
                        <span className="inline-flex text-green-600">
                            <ProMonolineIcon className="h-6 w-6" />
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{formatAmount(income?.total ?? null)}</div>
                    <div className="text-xs text-green-500 mt-2"><FormattedMessage id="dashboard.income.total_desc" defaultMessage="已获得的所有Token" /></div>
                </div>
            </div>

            {/* Referral Card */}
            <ReferralCard />

            {/* Transactions */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold"><FormattedMessage id="dashboard.recent_tx" defaultMessage="最近交易" /></h3>
                    <Link href="/dashboard/transactions" prefetch={false} className="text-[#4F46E5] hover:underline">
                        <FormattedMessage id="dashboard.view_all" defaultMessage="查看全部" />
                    </Link>
                </div>
                
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p><FormattedMessage id="dashboard.no_tx" defaultMessage="暂无交易记录" /></p>
                        <button 
                            onClick={() => window.location.href = '/payment'}
                            className="mt-4 glow-button px-6 py-2 rounded-lg"
                        >
                            <FormattedMessage id="dashboard.recharge" defaultMessage="立即充值" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        transaction.type === 'recharge' ? 'bg-green-100 text-green-600' :
                                        transaction.type === 'consume' ? 'bg-red-100 text-red-600' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {transaction.type === 'recharge' ? '↑' : '↓'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{transaction.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-bold ${
                                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {transaction.amount > 0 ? '+' : ''}¥{Math.abs(transaction.amount).toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        余额: ¥{transaction.balance.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// 个人资料标签
function ProfileTab({ user, onUpdate }: { user: User; onUpdate: (token: string) => void }) {
    const intl = useIntl();
    const [formData, setFormData] = useState({
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || '',
        age: user.age || '',
        gender: user.gender || '',
        profession: user.profession || '',
        industry: user.industry || '',
        education: user.education || '',
        school: user.school || '',
        country: user.country || '中国',
        province: user.province || '',
        city: user.city || '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // 省市数据
    const cityData = useMemo<Record<string, string[]>>(() => ({
        '北京市': ['北京市'],
        '上海市': ['上海市'],
        '天津市': ['天津市'],
        '重庆市': ['重庆市'],
        '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
        '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
        '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
        '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
        '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
        '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市'],
        '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市'],
        '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市'],
        '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
        '福建省': ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'],
        '安徽省': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'],
        '辽宁省': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
        '陕西省': ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'],
        '江西省': ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'],
        '云南省': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市'],
        '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
        '广西壮族自治区': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
        '贵州省': ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市'],
        '吉林省': ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市'],
        '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市'],
        '甘肃省': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市'],
        '内蒙古自治区': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市'],
        '新疆维吾尔自治区': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市'],
        '宁夏回族自治区': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
        '青海省': ['西宁市', '海东市'],
        '西藏自治区': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市'],
        '海南省': ['海口市', '三亚市', '三沙市', '儋州市'],
        '香港特别行政区': ['香港'],
        '澳门特别行政区': ['澳门'],
        '台湾省': ['台北市', '高雄市', '台中市', '台南市', '新北市', '桃园市']
    }), []);

    // 获取当前省份的城市列表（仅中国地区使用下拉）
    const isChinaRegion = (formData.country || '').trim() === '中国';
    const provinceOptions = useMemo(() => Object.keys(cityData), [cityData]);
    const availableCities = useMemo(() => {
        if (!isChinaRegion || !formData.province) return [];
        return cityData[formData.province] || [];
    }, [isChinaRegion, formData.province, cityData]);

    // 计算完整度
    const completeness = () => {
        const fields = [formData.name, formData.phone, formData.age, formData.gender, 
                       formData.profession, formData.industry, formData.education, formData.school,
                       formData.country, formData.province, formData.city];
        const filled = fields.filter(f => f && f !== '').length;
        return Math.round((filled / fields.length) * 100);
    };

    const isComplete = completeness() === 100;

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    age: formData.age === '' ? null : Number(formData.age),
                }),
            });

            if (!response.ok) throw new Error(intl.formatMessage({ id: 'dashboard.msg.save_error', defaultMessage: '保存失败' }));

            setMessage(intl.formatMessage({ id: 'dashboard.msg.save_success', defaultMessage: '✓ 保存成功' }));
            if (token) onUpdate(token);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(intl.formatMessage({ id: 'dashboard.msg.save_fail', defaultMessage: '✗ 保存失败' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-4xl">
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                    message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message}
                </div>
            )}

            {/* 完整度提示 */}
            {!isComplete && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🎁</span>
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1"><FormattedMessage id="dashboard.profile.complete_title" defaultMessage="完善资料，领取奖励！" /></h4>
                            <p className="text-sm text-blue-700 mb-2">
                                <FormattedMessage 
                                    id="dashboard.profile.complete_desc" 
                                    defaultMessage="完整填写个人资料，即可获得 <b>{tokens}</b> 奖励"
                                    values={{
                                        tokens: '5000 Token',
                                        b: (chunks) => <strong>{chunks}</strong>,
                                    }}
                                />
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${completeness()}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-blue-900">{completeness()}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="dashboard.tabs.profile" defaultMessage="个人资料" /></h2>
            
            <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-900"><FormattedMessage id="dashboard.profile.basic_info" defaultMessage="基本信息" /></h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.username" defaultMessage="用户名" /></label>
                            <input
                                type="text"
                                value={user.username}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1"><FormattedMessage id="dashboard.profile.username_desc" defaultMessage="用户名不可修改" /></p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.email" defaultMessage="邮箱" /></label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">可修改为常用邮箱，用于找回账号和接收验证码</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.nickname" defaultMessage="昵称" /></label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder={intl.formatMessage({ id: 'dashboard.profile.nickname_ph', defaultMessage: '输入你的昵称' })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.phone" defaultMessage="手机号" /></label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder={intl.formatMessage({ id: 'dashboard.profile.phone_ph', defaultMessage: '输入手机号' })}
                            />
                        </div>
                    </div>
                </div>

                {/* 个人信息 */}
                <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-900"><FormattedMessage id="dashboard.profile.personal_info" defaultMessage="个人信息" /></h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.age" defaultMessage="年龄" /></label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder={intl.formatMessage({ id: 'dashboard.profile.age_ph', defaultMessage: '输入年龄' })}
                                min="1"
                                max="150"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.gender" defaultMessage="性别" /></label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                <option value="male"><FormattedMessage id="dashboard.profile.gender.male" defaultMessage="男" /></option>
                                <option value="female"><FormattedMessage id="dashboard.profile.gender.female" defaultMessage="女" /></option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.education" defaultMessage="学历" /></label>
                            <select
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                <option value="high_school"><FormattedMessage id="dashboard.profile.edu.high_school" defaultMessage="高中" /></option>
                                <option value="bachelor"><FormattedMessage id="dashboard.profile.edu.bachelor" defaultMessage="本科" /></option>
                                <option value="master"><FormattedMessage id="dashboard.profile.edu.master" defaultMessage="硕士" /></option>
                                <option value="doctor"><FormattedMessage id="dashboard.profile.edu.doctor" defaultMessage="博士" /></option>
                                <option value="other"><FormattedMessage id="dashboard.profile.edu.other" defaultMessage="其他" /></option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.school" defaultMessage="就读院校" /></label>
                            <input
                                type="text"
                                value={formData.school}
                                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder={intl.formatMessage({ id: 'dashboard.profile.school_ph', defaultMessage: '输入学校名称' })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.profession" defaultMessage="专业/职业" /></label>
                            <select
                                value={formData.profession}
                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                <option value="学生"><FormattedMessage id="dashboard.profile.prof.student" defaultMessage="学生" /></option>
                                <option value="教师"><FormattedMessage id="dashboard.profile.prof.teacher" defaultMessage="教师" /></option>
                                <option value="研究员"><FormattedMessage id="dashboard.profile.prof.researcher" defaultMessage="研究员" /></option>
                                <option value="软件工程师"><FormattedMessage id="dashboard.profile.prof.engineer" defaultMessage="软件工程师" /></option>
                                <option value="产品经理"><FormattedMessage id="dashboard.profile.prof.pm" defaultMessage="产品经理" /></option>
                                <option value="设计师"><FormattedMessage id="dashboard.profile.prof.designer" defaultMessage="设计师" /></option>
                                <option value="市场营销"><FormattedMessage id="dashboard.profile.prof.marketing" defaultMessage="市场营销" /></option>
                                <option value="销售"><FormattedMessage id="dashboard.profile.prof.sales" defaultMessage="销售" /></option>
                                <option value="运营"><FormattedMessage id="dashboard.profile.prof.operations" defaultMessage="运营" /></option>
                                <option value="财务"><FormattedMessage id="dashboard.profile.prof.finance" defaultMessage="财务" /></option>
                                <option value="人力资源"><FormattedMessage id="dashboard.profile.prof.hr" defaultMessage="人力资源" /></option>
                                <option value="律师"><FormattedMessage id="dashboard.profile.prof.lawyer" defaultMessage="律师" /></option>
                                <option value="医生"><FormattedMessage id="dashboard.profile.prof.doctor" defaultMessage="医生" /></option>
                                <option value="自由职业"><FormattedMessage id="dashboard.profile.prof.freelancer" defaultMessage="自由职业" /></option>
                                <option value="其他"><FormattedMessage id="dashboard.profile.prof.other" defaultMessage="其他" /></option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 行业信息 */}
                <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-900"><FormattedMessage id="dashboard.profile.industry_info" defaultMessage="行业信息" /></h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.industry" defaultMessage="所属行业" /></label>
                            <select
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                <option value="internet"><FormattedMessage id="dashboard.profile.ind.internet" defaultMessage="互联网/IT" /></option>
                                <option value="finance"><FormattedMessage id="dashboard.profile.ind.finance" defaultMessage="金融" /></option>
                                <option value="education"><FormattedMessage id="dashboard.profile.ind.education" defaultMessage="教育" /></option>
                                <option value="medical"><FormattedMessage id="dashboard.profile.ind.medical" defaultMessage="医疗" /></option>
                                <option value="manufacturing"><FormattedMessage id="dashboard.profile.ind.manufacturing" defaultMessage="制造" /></option>
                                <option value="service"><FormattedMessage id="dashboard.profile.ind.service" defaultMessage="服务业" /></option>
                                <option value="other"><FormattedMessage id="dashboard.profile.ind.other" defaultMessage="其他" /></option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 地区信息 */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900"><FormattedMessage id="dashboard.profile.region_info" defaultMessage="地区信息" /></h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.country" defaultMessage="国家/地区" /></label>
                            <select
                                value={formData.country}
                                onChange={(e) => {
                                    const nextCountry = e.target.value;
                                    const next = { ...formData, country: nextCountry };
                                    if (nextCountry !== '中国') {
                                        next.province = '';
                                        next.city = '';
                                    }
                                    setFormData(next);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="中国"><FormattedMessage id="dashboard.profile.country.china" defaultMessage="中国" /></option>
                                <option value="海外"><FormattedMessage id="dashboard.profile.country.overseas" defaultMessage="海外/其他国家" /></option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.province" defaultMessage="省份" /></label>
                            {isChinaRegion ? (
                                <select
                                    value={formData.province}
                                    onChange={(e) => {
                                        setFormData({ ...formData, province: e.target.value, city: '' });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                    {provinceOptions.map((province) => (
                                        <option key={province} value={province}>{province}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.province}
                                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={intl.formatMessage({ id: 'dashboard.profile.province_ph', defaultMessage: '输入省/州' })}
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"><FormattedMessage id="dashboard.profile.city" defaultMessage="城市" /></label>
                            {isChinaRegion ? (
                                <select
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value=""><FormattedMessage id="dashboard.profile.select" defaultMessage="请选择" /></option>
                                    {availableCities.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder={intl.formatMessage({ id: 'dashboard.profile.city_ph', defaultMessage: '输入城市' })}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <FormattedMessage id="dashboard.profile.saving" defaultMessage="保存中..." />
                            </>
                        ) : (
                            <FormattedMessage id="dashboard.profile.save" defaultMessage="保存更改" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 账户安全标签
function SecurityTab() {
    const intl = useIntl();
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            setMessage(intl.formatMessage({ id: 'dashboard.security.pwd_mismatch', defaultMessage: '✗ 两次输入的密码不一致' }));
            return;
        }

        setSaving(true);
        setMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ password: passwords.new }),
            });

            if (!response.ok) throw new Error(intl.formatMessage({ id: 'dashboard.security.update_fail', defaultMessage: '修改失败' }));

            setMessage(intl.formatMessage({ id: 'dashboard.security.pwd_success', defaultMessage: '✓ 密码修改成功' }));
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(intl.formatMessage({ id: 'dashboard.security.pwd_fail', defaultMessage: '✗ 密码修改失败' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-2xl">
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                    message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message}
                </div>
            )}

            <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="dashboard.tabs.security" defaultMessage="账户安全" /></h2>
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-4"><FormattedMessage id="dashboard.security.change_password" defaultMessage="修改密码" /></h3>
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder={intl.formatMessage({ id: 'dashboard.security.current_pwd_ph', defaultMessage: '当前密码' })}
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="password"
                            placeholder={intl.formatMessage({ id: 'dashboard.security.new_pwd_ph', defaultMessage: '新密码' })}
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                            type="password"
                            placeholder={intl.formatMessage({ id: 'dashboard.security.confirm_pwd_ph', defaultMessage: '确认新密码' })}
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                            onClick={handleChangePassword}
                            disabled={saving || !passwords.current || !passwords.new}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <FormattedMessage id="dashboard.security.updating_btn" defaultMessage="更新中..." />
                            ) : (
                                <FormattedMessage id="dashboard.security.update_btn" defaultMessage="更新密码" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 订阅管理标签
function SubscriptionTab({ user }: { user: User }) {
    return (
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold mb-6"><FormattedMessage id="dashboard.subscription.title" defaultMessage="订阅管理" /></h2>
            
            <div className="space-y-6">
                <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium"><FormattedMessage id="dashboard.subscription.current_plan" defaultMessage="当前套餐" /></h3>
                            <p className="text-gray-600">
                                {user.licenseType === 'trial' ? <FormattedMessage id="dashboard.subscription.plan.trial" defaultMessage="试用版" /> : 
                                 user.licenseType === 'subscription' ? <FormattedMessage id="dashboard.subscription.plan.subscription" defaultMessage="订阅版" /> : 
                                 user.licenseType === 'lifetime' ? <FormattedMessage id="dashboard.subscription.plan.lifetime" defaultMessage="终身版" /> : <FormattedMessage id="dashboard.subscription.plan.free" defaultMessage="免费版" />}
                            </p>
                        </div>
                        <span className="text-3xl inline-flex items-center">
                            {user.licenseType === 'lifetime' ? '👑' :
                             user.licenseType === 'subscription' ? <ProMonolineIcon className="h-8 w-8 text-indigo-600" /> : '🆓'}
                        </span>
                    </div>
                    
                    {user.subscriptionEnd && (
                        <p className="text-sm text-gray-600">
                            <FormattedMessage 
                                id="dashboard.subscription.expire_date" 
                                defaultMessage="到期时间: {date}"
                                values={{ date: new Date(user.subscriptionEnd).toLocaleDateString() }}
                            />
                        </p>
                    )}
                </div>

                <div className="text-center py-8">
                    <Link
                        href="/store"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
                    >
                        <FormattedMessage id="dashboard.subscription.view_all" defaultMessage="查看所有套餐" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
