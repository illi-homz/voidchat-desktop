import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className='h-full w-full flex flex-col' style={{ backgroundColor: 'var(--color-bg)' }}>
      <Outlet />
    </div>
  );
}
