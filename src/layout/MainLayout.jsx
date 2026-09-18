import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import NotificationDropdown from '../components/NotificationDropdown';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  Users, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Search,
  Calendar,
  BarChart3,
  Building2
} from 'lucide-react';
const { logout } = require('../store/slices/authSlice');

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const res = await api.get(`/search?q=${searchQuery}`);
          setSearchResults(res.data.data);
          setIsSearchOpen(true);
        } catch (err) {
          console.error('Search failed');
        }
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: location.pathname === '/dashboard', section: 'work' },
    { name: 'My Tasks', href: '/tasks/me', icon: CheckSquare, current: location.pathname.includes('/tasks'), section: 'work' },
    { name: 'Projects', href: '/projects', icon: FolderKanban, current: location.pathname.includes('/projects'), section: 'work' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, current: location.pathname.includes('/calendar'), section: 'work' },
    { name: 'Team', href: '/users', icon: Users, current: location.pathname.includes('/users'), hide: user?.role === 'employee', section: 'management' },
    { name: 'Reports', href: '/reports', icon: BarChart3, current: location.pathname.includes('/reports'), hide: user?.role === 'employee', section: 'management' },
    { name: 'Organizations', href: '/organizations', icon: Building2, current: location.pathname.includes('/organizations'), hide: user?.role !== 'super_admin', section: 'management' },
    { name: 'Settings', href: '/settings', icon: Settings, current: location.pathname.includes('/settings'), section: 'management' },
  ].filter(item => !item.hide);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-6">
               <div className="h-8 w-8 bg-brand-600 rounded text-white flex items-center justify-center font-bold text-lg mr-2">TM</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">TaskMaster</span>
            </div>
            {/* Mobile Nav contents identical to Desktop */}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-slate-200 z-10">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-6">
              <div className="h-8 w-8 bg-brand-600 rounded flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <span className="ml-3 text-lg font-bold text-slate-900 tracking-tight">TaskMaster</span>
            </div>
            
            {/* Org Info */}
            <div className="px-6 mb-6">
              <div className="py-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                  {user?.organizationId?.name || 'Organization'}
                </p>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-6">
               <div>
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Work</p>
                  <div className="space-y-1">
                     {navigation.filter(n => n.section === 'work').map((item) => (
                     <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                           item.current ? 'bg-slate-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                     >
                        <item.icon className={`${item.current ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'} mr-3 flex-shrink-0 h-5 w-5`} aria-hidden="true" />
                        {item.name}
                     </Link>
                     ))}
                  </div>
               </div>

               {navigation.filter(n => n.section === 'management').length > 0 && (
                  <div>
                     <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Management</p>
                     <div className="space-y-1">
                        {navigation.filter(n => n.section === 'management').map((item) => (
                        <Link
                           key={item.name}
                           to={item.href}
                           className={`${
                              item.current ? 'bg-slate-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                           } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                        >
                           <item.icon className={`${item.current ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'} mr-3 flex-shrink-0 h-5 w-5`} aria-hidden="true" />
                           {item.name}
                        </Link>
                        ))}
                     </div>
                  </div>
               )}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
             <div className="flex items-center w-full">
                <div className="h-9 w-9 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                   {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="ml-3">
                   <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                   <p className="text-xs font-medium text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col w-full flex-1 min-w-0">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200">
          <button
            type="button"
            className="px-4 border-r border-slate-200 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 sm:px-6 md:px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="flex-1 flex items-center">
              <div className="w-full max-w-md relative" ref={searchRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                  placeholder="Search tasks, projects, users..."
                />
                
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg border border-slate-200 rounded-md py-2 z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div 
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          if (result.type === 'project') navigate(`/projects/${result.id}`);
                          if (result.type === 'task') navigate(`/tasks/me`); // For now, could go to project
                          if (result.type === 'user') navigate(`/users`);
                        }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{result.title}</p>
                            <p className="text-xs text-slate-500">{result.subtitle}</p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {result.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isSearchOpen && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg border border-slate-200 rounded-md py-4 z-50 text-center text-sm text-slate-500">
                    No results found.
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <NotificationDropdown />
              
              <div className="h-5 w-px bg-slate-200"></div>

              <button
                 onClick={handleLogout}
                 className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                 <LogOut className="h-4 w-4 mr-1.5" />
                 Logout
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="py-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
