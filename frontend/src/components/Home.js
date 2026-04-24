import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="text-center mt-24">
    
  
      <div className="mt-8 space-x-4">
        <Link to="/customer" className="px-6 py-3 bg-blue-600 text-white no-underline rounded-md hover:bg-blue-700">
          Customer Portal
        </Link>
        
        <Link to="/agent" className="px-6 py-3 bg-green-600 text-white no-underline rounded-md hover:bg-green-700">
          Agent Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Home;
