import React from "react";

function MessageBubble({ text, sender }) {
  const isUser = sender === "user";

  return (
    <div
      className={`flex items-end gap-2 mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/*  AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
          AI
        </div>
      )}

      {/*  MESSAGE */}
      <div
        className={`
          max-w-[70%] break-words whitespace-pre-wrap
          px-4 py-2 rounded-2xl text-sm leading-relaxed
          transition-all duration-200
          ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/20"
              : "bg-white/10 text-slate-200 rounded-bl-none backdrop-blur-md"
          }
        `}
      >
        {text}
      </div>

      {/*  USER Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
          U
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
