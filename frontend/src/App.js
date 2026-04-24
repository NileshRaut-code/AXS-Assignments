import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import CustomerCall from "./pages/CustomerCall"
import AgentDashboard from "./pages/AgentDashboard"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/customer",
    element: <CustomerCall />,
  },
  {
    path: "/agent",
    element: <AgentDashboard />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
