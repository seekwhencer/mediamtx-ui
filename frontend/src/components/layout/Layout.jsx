import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <TopBar />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
