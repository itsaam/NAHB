import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import {AuthProvider} from "./context/AuthContext";
import {ProtectedRoute} from "./utils/ProtectedRoute";
import Navbar from "./components/Navbar";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StoriesPage from "./pages/StoriesPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import ReadStoryPage from "./pages/ReadStoryPage";
import MyStoriesPage from "./pages/MyStoriesPage";
import AdminDashboard from "./pages/AdminDashboard";
import StoryEditorPage from "./pages/StoryEditorPage.jsx";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MyActivitiesPage from "./pages/MyActivitiesPage";

import "./App.css";

function AppContent() {
    const location = useLocation();
    const hideNavbar = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ].includes(location.pathname);

    return (
        <div className="min-h-screen">
            {!hideNavbar && <Navbar/>}
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                <Route path="/stories" element={<StoriesPage/>}/>

                {/* Story Detail - Public */}
                <Route path="/story/:id" element={<StoryDetailPage/>}/>

                {/* Protected Routes */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/read/:sessionId"
                    element={
                        <ProtectedRoute>
                            <ReadStoryPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-activites"
                    element={
                        <ProtectedRoute>
                            <MyActivitiesPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-stories"
                    element={
                        <ProtectedRoute requireAuthor>
                            <MyStoriesPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/story/:storyId/edit"
                    element={
                        <ProtectedRoute requireAuthor>
                            <StoryEditorPage/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminDashboard/>
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent/>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
