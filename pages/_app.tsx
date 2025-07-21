import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../components/ToastProvider';
import '../styles/globals.css';

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </SessionProvider>
  );
}
