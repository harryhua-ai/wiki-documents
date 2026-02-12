import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ChatWidget from '../components/AskAI/ChatWidget';

// Wrap the Docusaurus root to inject Ask AI widget
export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      {children}
      <BrowserOnly>
        {() => <ChatWidget />}
      </BrowserOnly>
    </>
  );
}
