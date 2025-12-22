import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signin } from './utils/api';

export default function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await signin({ email, password });

      onSignIn(data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0 mt-10">
      <div className="w-full bg-[rgb(var(--bg-rgb)/0.8)] rounded-lg shadow border border-[rgb(var(--fg-rgb)/0.1)] md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
            Sign in to your account
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium">Your email</label>
              <input
                type="email"
                name="email"
                id="email"
                className="border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] border-[rgb(var(--fg-rgb)/0.2)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password"className="block mb-2 text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] border-[rgb(var(--fg-rgb)/0.2)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-light text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="text-sm font-light text-gray-400">
              Don’t have an account yet? <Link to="/signup" className="font-medium text-primary-500 hover:underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
