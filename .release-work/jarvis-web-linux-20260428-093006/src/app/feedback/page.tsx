'use client';

import { useState } from 'react';
import ProMonolineIcon from '@/components/ProMonolineIcon';

export default function Feedback() {
    const [activeTab, setActiveTab] = useState('public');

    return (
        <div className="min-h-screen p-8 pt-12 max-w-6xl mx-auto">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Feature <span className="gradient-text">Requests</span></h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Help shape the future of JarvisAI. Vote for features you want to see next,
                    or bid to fast-track your specific needs.
                </p>
            </header>

            {/* Tabs */}
            <div className="flex justify-center mb-12">
                <div className="glass-panel p-1 rounded-full flex">
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'public' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        Public Board
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'premium' ? 'bg-[var(--google-yellow)] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <ProMonolineIcon className="h-4 w-4" />
                            Premium Auction
                        </span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'public' ? <PublicBoard /> : <PremiumAuction />}
        </div>
    );
}

function PublicBoard() {
    const [features, setFeatures] = useState([
        { id: 1, title: "Python Type Hinting Support", votes: 124, tag: "Enhancement" },
        { id: 2, title: "VS Code Theme Integration", votes: 89, tag: "UI/UX" },
        { id: 3, title: "Docker Compose Generator", votes: 56, tag: "Feature" },
    ]);

    const handleVote = (id: number) => {
        setFeatures(features.map(f => f.id === id ? { ...f, votes: f.votes + 1 } : f));
    };

    return (
        <div className="space-y-4">
            {features.sort((a, b) => b.votes - a.votes).map((feature) => (
                <div key={feature.id} className="glass-panel p-6 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{feature.title}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400">{feature.tag}</span>
                        </div>
                        <p className="text-gray-500 text-sm">Requested by Community</p>
                    </div>
                    <button
                        onClick={() => handleVote(feature.id)}
                        className="flex flex-col items-center gap-1 min-w-[80px] p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span className="text-2xl">▲</span>
                        <span className="font-bold">{feature.votes}</span>
                    </button>
                </div>
            ))}
        </div>
    );
}

function PremiumAuction() {
    const auctions = [
        { id: 1, title: "Custom Enterprise SSO", currentBid: 5000, bidder: "Corp_X", timeLeft: "2d 4h" },
        { id: 2, title: "Cobol Legacy Refactor Agent", currentBid: 2400, bidder: "Bank_Y", timeLeft: "5d 12h" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auctions.map((auction) => (
                <div key={auction.id} className="glass-panel p-8 border border-[var(--google-yellow)]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[var(--google-yellow)] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        LIVE AUCTION
                    </div>

                    <h3 className="text-2xl font-bold mb-2">{auction.title}</h3>
                    <div className="text-[var(--google-yellow)] text-sm mb-6">Ends in {auction.timeLeft}</div>

                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="text-gray-400 text-sm">Current Highest Bid</div>
                            <div className="text-4xl font-bold text-[var(--google-yellow)]">${auction.currentBid}</div>
                            <div className="text-xs text-gray-500 mt-1">Held by {auction.bidder}</div>
                        </div>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-[var(--google-yellow)] text-black font-bold hover:brightness-110 transition-all">
                        Place Bid (${auction.currentBid + 100})
                    </button>
                </div>
            ))}

            {/* New Auction Card */}
            <div className="glass-panel p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                <div className="text-4xl mb-4">➕</div>
                <h3 className="text-xl font-bold mb-2">Start New Auction</h3>
                <p className="text-gray-400 text-sm">
                    Have a specific need? Start an auction to get it prioritized.
                </p>
            </div>
        </div>
    );
}
