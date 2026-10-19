import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import MyRecipes from "./pages/MyRecipes";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import Favorites from "./pages/Favorites";
import LikedRecipes from "./pages/LikedRecipes";

import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
        <Route path="/create-recipe" element={<CreateRecipe />} />

        <Route path="/edit-recipe/:id" element={<EditRecipe />} />

        <Route path="/favorites" element={<Favorites />} />
        <Route path="/liked-recipes" element={<LikedRecipes />} />

        <Route path="/recipe/:id" element={<RecipeDetails />} />
        <Route path="/recipes/:id" element={<RecipeDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
