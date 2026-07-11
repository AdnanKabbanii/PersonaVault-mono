"use client";

import { MessageContent } from "@/components/MessageContent";
import { StarField } from "@/components/StarField";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, ToolCall, mastraChatService, testApiConnection } from "@/lib/mastra-client";
import { UploadedFile, personavaultService } from "@/lib/personavault-service";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  History,
  LogOut,
  MessageSquare,
  Send,
  Upload,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";



export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'history'>('upload');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<ChatMessage | null>(null);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
      
      try {
        const connected = await testApiConnection();
        setApiConnected(connected);
      } catch (error) {
        console.error('API connection test failed:', error);
        setApiConnected(false);
      } finally {
        setIsConnecting(false);
      }

      try {
        const documents = await personavaultService.getUserDocuments(user.id);
        setUploadedFiles(documents);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    getUser();
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeToolCalls]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const clearAllDocuments = async () => {
    if (!user) return;
    
    try {
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error clearing documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setIsUploading(true);

    try {
      const workspaceId = await personavaultService.ensureDefaultWorkspace(user.id);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const tempFile: UploadedFile = {
          id: Date.now().toString() + i,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          status: 'uploading'
        };

        setUploadedFiles(prev => [...prev, tempFile]);

        try {
          const uploadedFile = await personavaultService.uploadDocument(file, user.id, workspaceId);

          setUploadedFiles(prev =>
            prev.map(f => 
              f.id === tempFile.id ? uploadedFile : f
            )
          );
        } catch (error) {
          console.error('Upload failed for', file.name, error);
          
          // Mark as failed
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === tempFile.id 
                ? { ...f, status: 'error' as const }
                : f
            )
          );
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || isConnecting) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Create a placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, assistantMessage]);

    // Set a timeout to check if the message is still empty after 10 seconds
    const timeoutId = setTimeout(() => {
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId && msg.content === ''
            ? { ...msg, content: 'No response received. Please try again.' }
            : msg
        )
      );
    }, 10000);

    try {
      try {
        setActiveToolCalls([]);
        setCurrentStreamingMessage(assistantMessage);

        const finalMessage = await mastraChatService.sendChatMessageStream(
          chatInput,
          user.id,
          (chunk: string) => {
            setChatMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          (toolCall: ToolCall) => {
            setActiveToolCalls(prev => {
              const existing = prev.find(tc => tc.id === toolCall.id);
              if (existing) {
                return prev.map(tc => tc.id === toolCall.id ? toolCall : tc);
              } else {
                return [...prev, toolCall];
              }
            });
          }
        );

        setChatMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...finalMessage, id: assistantMessageId }
              : msg
          )
        );

        setActiveToolCalls([]);
        setCurrentStreamingMessage(null);
        clearTimeout(timeoutId);
      } catch (streamError) {
        console.warn('Streaming failed, falling back to regular chat:', streamError);

        setActiveToolCalls([]);
        setCurrentStreamingMessage(null);

        const aiMessage = await mastraChatService.sendChatMessage(chatInput, user.id);

        setChatMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: aiMessage.content }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Clear streaming state
      setActiveToolCalls([]);
      setCurrentStreamingMessage(null);
      
      // Update the assistant message with error
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'error':
        return 'Error';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-text">PERSONAVAULT</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut} className="border-purple-500/50 hover:bg-purple-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative min-h-screen pt-20">
        <StarField />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-background"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6 z-10 relative"
        >
          {/* Dashboard Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="glass-card p-8 rounded-3xl backdrop-blur-xl mb-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Your Knowledge Vault</h1>
              <p className="text-muted-foreground text-lg">
                Upload documents, chat with AI, and explore your knowledge base
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="glass-card p-1 rounded-2xl">
                <div className="flex space-x-1">
                  {[
                    { id: 'upload', label: 'Upload Files', icon: Upload },
                    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                    { id: 'history', label: 'History', icon: History }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                                                 onClick={() => setActiveTab(tab.id as 'upload' | 'chat' | 'history')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {activeTab === 'upload' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Upload Area */}
                  <div className="glass-card p-8 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-colors">
                    <div className="text-center">
                      <Upload className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-2xl font-semibold mb-2">Upload Your Documents</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload PDFs, text files, and documents to build your knowledge base
                      </p>
                      <div className="space-y-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label 
                          htmlFor="file-upload"
                          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="mr-2 h-4 w-4 inline" />
                          {isUploading ? 'Uploading...' : 'Choose Files'}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Supported: PDF, TXT, DOC, DOCX (Max 10MB each)
                        </p>
                        

                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Uploaded Files</h3>
                        <Button
                          onClick={clearAllDocuments}
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {uploadedFiles.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-purple-400" />
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <span className="text-sm">{getStatusText(file.status)}</span>
                              {file.status === 'error' && (
                                <span className="text-xs text-red-400">Upload failed</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coming Soon */}
                  <div className="glass-card p-6 rounded-2xl border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                      <h3 className="text-lg font-semibold">Coming Soon</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Image and video upload support will be available soon. For now, focus on text-based documents for the best AI analysis.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="h-[600px] flex flex-col"
                >
                  {/* API Connection Status */}
                  {isConnecting ? (
                    <div className="glass-card p-4 rounded-2xl mb-4 border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                        <span className="text-sm text-yellow-400">Connecting to AI service...</span>
                      </div>
                    </div>
                  ) : !apiConnected ? (
                    <div className="glass-card p-4 rounded-2xl mb-4 border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-400">AI service not available. Please ensure the PersonaVault server is running on port 4112.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card p-4 rounded-2xl mb-4 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-400">Connected to PersonaVault AI Agent</span>
                      </div>
                    </div>
                  )}
                  {/* Chat Messages */}
                  <div className="flex-1 glass-card p-6 rounded-2xl mb-4 overflow-y-auto">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                          <h3 className="text-lg font-semibold mb-2">
                            {apiConnected ? 'Start a Conversation' : 'AI Service Unavailable'}
                          </h3>
                          <p className="text-muted-foreground">
                            {apiConnected 
                              ? 'Ask questions about your uploaded documents and get AI-powered insights.'
                              : 'Please ensure the PersonaVault server is running to enable AI chat functionality.'
                            }
                          </p>
                        </div>
                      ) : (
                        <>
                          {chatMessages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-4 rounded-2xl ${
                                  message.role === 'user'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                {message.role === 'assistant' ? (
                                  <div className="space-y-3">
                                    {/* Tool Calls */}
                                    {message.toolCalls && message.toolCalls.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="text-xs text-gray-400 mb-2">Tools used:</div>
                                        {message.toolCalls.map((toolCall) => (
                                          <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Message Content */}
                                    {message.content && (
                                      <MessageContent content={message.content} />
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                
                                <p className="text-xs opacity-70 mt-3">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Active Tool Calls (for current streaming message) */}
                          {activeToolCalls.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-start"
                            >
                              <div className="max-w-[80%] p-4 rounded-2xl bg-white/10 text-white">
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-400 mb-2">Running tools...</div>
                                  {activeToolCalls.map((toolCall) => (
                                    <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSubmitChat} className="flex gap-3">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={apiConnected ? "Ask about your documents..." : "AI service not available"}
                      disabled={!apiConnected}
                      className="flex-1 bg-white/10 border-purple-500/20 focus:border-purple-500/50 disabled:opacity-50"
                    />
                    <Button 
                      type="submit" 
                      disabled={!apiConnected}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Recent Activity */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {uploadedFiles.slice(0, 5).map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-purple-400" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded {file.uploadedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {getStatusIcon(file.status)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat History */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-4">Chat History</h3>
                    <div className="space-y-3">
                      {chatMessages.slice(0, 5).map((message) => (
                        <div key={message.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {message.role === 'user' ? 'You' : 'AI Assistant'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
} 