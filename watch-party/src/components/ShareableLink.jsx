import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const ShareableLink = ({ link }) => {
  const [copied, setCopied] = useState(false);

  // This function handles copying the link to the clipboard.
  // It uses the document.execCommand('copy') method for broad browser compatibility,
  // especially within iframes where navigator.clipboard can be restricted.
  const handleCopy = () => {
    // Create a temporary textarea element to hold the link text
    const textArea = document.createElement("textarea");
    textArea.value = link;
    // Style it to be invisible
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);

    // Select and copy the text
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true); // Set state to show confirmation
      // Reset the confirmation message after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    // Clean up and remove the temporary element
    document.body.removeChild(textArea);
  };

  if (!link) {
    return null; // Don't render anything if no link is provided
  }

  return (
    <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4">
      {/* Link Display */}
      <p className="text-indigo-400 font-mono text-sm truncate" title={link}>
        {link}
      </p>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
          copied
            ? "bg-green-500 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white"
        }`}
        title="Copy to clipboard"
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>
    </div>
  );
};

export default ShareableLink;
