import { ToolCall } from "@/lib/mastra-client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronDown, Clock, Zap } from "lucide-react";
import { useState } from "react";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Zap className="w-3 h-3 text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'completed':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const formatToolName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${getStatusColor()} backdrop-blur-sm`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Zap className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">
            {formatToolName(toolCall.name)}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {toolCall.status === 'pending' ? 'Running...' : 
             toolCall.status === 'completed' ? 'Completed' :
             toolCall.status === 'error' ? 'Failed' : 'Unknown'}
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Arguments */}
              {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-300 mb-1">Arguments:</div>
                  <div className="bg-black/20 rounded p-2 text-xs font-mono">
                    <pre className="text-gray-300 whitespace-pre-wrap break-words">
                      {formatValue(toolCall.args)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Result */}
              {toolCall.result && (
                <div>
                  <div className="text-xs font-medium text-gray-300 mb-1">Result:</div>
                  <div className="bg-black/20 rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    <pre className="text-gray-300 whitespace-pre-wrap break-words">
                      {formatValue(toolCall.result)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tool ID for debugging */}
              <div className="text-xs text-gray-500">
                ID: {toolCall.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
