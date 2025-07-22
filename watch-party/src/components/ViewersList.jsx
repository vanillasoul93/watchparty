import React from "react";
import { Users } from "lucide-react";

const ViewersList = ({ viewers }) => {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
        <Users size={20} /> Viewers ({viewers?.length || 0})
      </h3>
      <ul className="space-y-1">
        {viewers?.map((viewer) => (
          // The 'key' prop is added here
          <li
            key={viewer.user_id}
            className={
              viewer.is_conductor
                ? "font-bold text-indigo-400"
                : "text-gray-300"
            }
          >
            {viewer.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewersList;
