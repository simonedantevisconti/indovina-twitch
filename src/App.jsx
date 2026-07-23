import { BrowserRouter, Route, Routes } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Lobby from "./pages/Lobby";
import JoinRoom from "./pages/JoinRoom";
import PublicRooms from "./pages/PublicRooms";
import WaitingRoom from "./pages/WaitingRoom";
import Game from "./pages/Game";
import RoomNotFound from "./pages/RoomNotFound";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Homepage />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            }
          />

          <Route
            path="/join"
            element={
              <ProtectedRoute>
                <JoinRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <PublicRooms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <WaitingRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/:roomId"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />

          <Route path="/room-not-found" element={<RoomNotFound />} />

          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
