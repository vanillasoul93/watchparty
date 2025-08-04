import React from "react";
import { Users, User } from "lucide-react"; // Import the User icon
import { Link } from "react-router-dom";

const ViewersList = ({ viewers }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-4 rounded-lg flex flex-col h-full">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2 flex-shrink-0">
        <Users size={20} /> Viewers ({viewers?.length || 0})
      </h3>

      <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {viewers?.map((viewer) => (
          <li key={viewer.user_id}>
            <Link
              to={`/profile/${viewer.username}`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="View Profile" // Tooltip for the hover text
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gray-400" />
              </div>

              <span
                className={`truncate ${
                  viewer.is_conductor
                    ? "font-bold text-indigo-400"
                    : "text-gray-300"
                }`}
              >
                {viewer.username}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewersList;
