import React from "react";
import { Users } from "lucide-react";

const ViewersList = ({ viewers }) => {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
        <Users size={20} /> Viewers ({viewers?.length || 0})
      </h3>
      <ul className="space-y-1 text-gray-300">
        {viewers?.map((viewer) => (
          <li key={viewer.userId}>{viewer.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default ViewersList;
