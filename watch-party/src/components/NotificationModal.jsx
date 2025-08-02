import React, { useEffect } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

const NotificationModal = ({ message, type, onClose }) => {
  useEffect(() => {
    // Automatically close the modal after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-10 right-10 z-[100] bg-gray-800 text-white rounded-lg shadow-2xl flex items-center p-4 border-l-4 border-indigo-500">
      {isSuccess ? (
        <CheckCircle className="text-green-400 mr-4 flex-shrink-0" size={24} />
      ) : (
        <AlertCircle className="text-yellow-400 mr-4 flex-shrink-0" size={24} />
      )}
      <p>{message}</p>
    </div>
  );
};

export default NotificationModal;
