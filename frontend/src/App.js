import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./components/Home"
import CustomerCall from "./components/CustomerCall"
import AgentDashboard from "./components/AgentDashboard"

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
