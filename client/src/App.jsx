import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import router from './router';
import Loader from './components/common/Loader';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <SettingsProvider>
        <Suspense fallback={<Loader fullPage />}>
          <RouterProvider router={router} />
        </Suspense>
      </SettingsProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
