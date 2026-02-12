# Frontend Architecture (FRONTEND_ARCH.md)

This document defines the React component hierarchy, state management, and integration strategy for the **Ask AI** feature in Docusaurus.

## 1. Component Hierarchy

All components reside in `src/components/AskAI/`.

*   **`ChatWidget`** (Container, lazy-loaded)
    *   **`ChatButton`** (Floating Action Button)
        *   Icon (Message/Close toggle)
        *   Badge (Unread notifications, optional)
    *   **`ChatWindow`** (Main Panel, fixed position)
        *   **`ChatHeader`**
            *   Title ("Ask CamThink AI")
            *   Actions (Clear history, Minimize, Close)
        *   **`MessageList`** (Scrollable area)
            *   **`WelcomeMessage`** (Initial greeting)
            *   **`MessageBubble`** (Polymorphic: User/Assistant)
                *   **`MarkdownRenderer`** (React-markdown with code highlighting)
                *   **`SourceReference`** (Accordion for citations)
                *   **`FeedbackActions`** (Thumbs up/down)
            *   **`TypingIndicator`** (Dot animation during streaming)
            *   **`AgentProgress`** (Step tracker: "Analyzing...", "Searching...")
        *   **`SuggestionList`** (Horizontal scroll of "Quick Prompts")
        *   **`InputArea`**
            *   `Textarea` (Auto-resizing)
            *   `SendButton` (Submit icon)
            *   `LegalNotice` (Tiny footer text)

## 2. State Management (`useChat` Hook)

Encapsulates all chat logic, API calls, and persistence.

### State Interface
```typescript
interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  routingPath: 'fast' | 'agent' | null;
  agentStep: string | null; // "Searching docs..."
  messages: Message[]; // { id, role, content, sources? }
  streamingContent: string; // Buffer for current stream
  sessionId: string;
}
```

### Actions
*   `toggleChat()`: Open/close widget.
*   `sendMessage(text)`:
    *   Optimistic UI update (add user msg).
    *   Init SSE connection.
    *   Handle events (`chunk`, `routing`, `progress`, `done`).
*   `submitFeedback(msgId, rating)`: API call to `/api/feedback`.
*   `resetSession()`: Clear messages, generate new Session ID.

### Persistence
*   `sessionStorage`: Stores `sessionId` and `messages` to survive page reloads (but clear on tab close).
*   `localStorage`: Stores `isOpen` preference (optional).

## 3. Interaction Design

### 3.1 Animations
*   **Entry**: Slide-up from bottom-right (`transform: translateY(20px) -> 0`, `opacity: 0 -> 1`).
*   **Streaming**:
    *   Blinking cursor `|` at end of streaming text.
    *   Smooth scroll-to-bottom on new chunks.

### 3.2 Mobile Responsiveness
*   **Desktop (>768px)**:
    *   Width: `400px`
    *   Height: `min(700px, 80vh)`
    *   Position: Fixed `bottom: 20px`, `right: 20px`
*   **Mobile (≤768px)**:
    *   Width: `100vw`
    *   Height: `100vh` (Full screen)
    *   Position: Fixed `top: 0`, `left: 0`
    *   Z-Index: `200` (Above navbar)

## 4. Docusaurus Integration

### 4.1 Global Mounting
Use **Docusaurus Theme Swizzling** (Wrapper) to ensure the widget persists across page navigation.

**File**: `src/theme/Root.tsx`
```tsx
import React from 'react';
import ChatWidget from '@site/src/components/AskAI/ChatWidget';

export default function Root({children}) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

### 4.2 Styling (CSS Modules)
Use `ask-ai.module.css` to prevent conflicts.

```css
/* Reuse Infima variables for theme consistency */
.chatWindow {
  background-color: var(--ifm-card-background-color);
  border: 1px solid var(--ifm-color-emphasis-200);
  box-shadow: var(--ifm-global-shadow-lw);
}
```

### 4.3 Internationalization
Use `<Translate>` for all UI labels.
Pass `docusaurusContext.i18n.currentLocale` to the API to ensure the AI responds in the correct language.
