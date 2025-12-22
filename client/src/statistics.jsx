import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './utils/api';

export default function StatisticsPage({ user: userProp }) {
  const navigate = useNavigate();
  const user = useMemo(() => {
    if (userProp) return userProp;
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [userProp]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) {
        setError('You must be signed in to see statistics.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/user/${user.id}/stats`, { method: 'GET' });
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load statistics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winRate = stats?.winRate ?? 0;
  const totalBet = stats?.totalBet ?? 0;
  const totalPayout = stats?.totalPayout ?? 0;
  const net = stats?.net ?? 0;

  const formatMoney = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n || 0));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Statistics</h1>

      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        {loading && (
          <div className="text-gray-300">
            Loading your stats…
          </div>
        )}

        {!loading && error && (
          <div className="text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Games Played</h2>
              <p className="text-gray-300">{gamesPlayed}</p>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Wins</h2>
              <p className="text-gray-300">{wins}</p>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Losses</h2>
              <p className="text-gray-300">{losses}</p>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Win Rate</h2>
              <p className="text-gray-300">{Number(winRate).toFixed(1)}%</p>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Total Bet</h2>
                <p className="text-gray-300">{formatMoney(totalBet)}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Total Payout</h2>
                <p className="text-gray-300">{formatMoney(totalPayout)}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Net</h2>
                <p className={net >= 0 ? 'text-green-300' : 'text-red-300'}>
                  {formatMoney(net)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <button 
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        onClick={() => {
          navigate(-1);
        }}
      >
        Back
      </button>
    </div>
  );
}
