import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { signIn, getProviders, ClientSafeProvider } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';
import Head from 'next/head';

interface SignInProps {
  providers: Record<string, ClientSafeProvider>;
}

export default function SignIn({ providers }: SignInProps) {
  return (
    <>
      <Head>
        <title>Sign In - Discord Bot Dashboard</title>
        <meta name="description" content="Sign in to your Discord Bot Dashboard" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-discord-dark to-discord-darker flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-discord-primary">
              <FaDiscord className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Access your Discord Bot Dashboard
            </p>
          </div>
          
          <div className="mt-8 space-y-6">
            {Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-discord-primary hover:bg-discord-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-discord-primary transition-colors duration-200"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaDiscord className="h-5 w-5 text-discord-primary-dark group-hover:text-discord-primary" />
                  </span>
                  Sign in with {provider.name}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-discord-dark text-gray-300">
                  Secure Discord OAuth
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, {});
  
  // If user is already logged in, redirect to dashboard
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  const providers = await getProviders();
  
  return {
    props: {
      providers: providers ?? {},
    },
  };
};
