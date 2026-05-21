import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WelcomePage } from './pages/WelcomePage';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { AddServerPage } from './pages/AddServerPage';
import { AddFriendPage } from './pages/AddFriendPage';
import { ShareIdPage } from './pages/ShareIdPage';
import { CallPage } from './pages/CallPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<WelcomePage />} />
          <Route path='/home' element={<HomePage />} />
          <Route path='/chat/:contactId' element={<ChatPage />} />
          <Route path='/add-server' element={<AddServerPage />} />
          <Route path='/add-friend' element={<AddFriendPage />} />
          <Route path='/share-id' element={<ShareIdPage />} />
        </Route>
        <Route path='/call' element={<CallPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
