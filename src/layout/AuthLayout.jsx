import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="h-10 w-10 bg-brand-600 rounded flex items-center justify-center shadow-sm">
               <span className="text-xl font-bold text-white">T</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Sign in to TaskMaster</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enterprise workspace management
            </p>
          </div>

          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
         <div className="absolute inset-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black flex items-center justify-center p-12">
            <div className="max-w-xl text-center">
               <h1 className="text-4xl font-bold text-white mb-6">Manage projects across your entire organization.</h1>
               <p className="text-lg text-slate-400">TaskMaster provides complete data isolation for multiple companies, role-based access control, and intuitive tools to get work done efficiently.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuthLayout;
