import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import FaceRecognition from '@/pages/FaceRecognition';
import AddFace from '@/pages/AddFace';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path={ROUTES.LANDING} element={<Landing />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.FACE_RECOGNITION}
            element={
              <ProtectedRoute>
                <FaceRecognition />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADD_FACE}
            element={
              <ProtectedRoute>
                <AddFace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
