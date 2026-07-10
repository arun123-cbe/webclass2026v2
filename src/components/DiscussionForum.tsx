import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { ForumPost, ForumReply, Student } from "../types";
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  PlusCircle, 
  CornerDownRight, 
  ChevronRight, 
  Filter,
  User,
  Clock,
  MessageCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface DiscussionForumProps {
  currentStudent: Student | null;
  activeLessonId: string;
}

export default function DiscussionForum({ currentStudent, activeLessonId }: DiscussionForumProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "lesson">("all");
  const [error, setError] = useState<string | null>(null);

  // Thread expansion
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Form states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Load posts
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const postsRef = collection(db, "forum_posts");
      let q = query(postsRef, orderBy("createdAt", "desc"));
      
      if (filterMode === "lesson") {
        q = query(postsRef, where("lessonId", "==", activeLessonId), orderBy("createdAt", "desc"));
      }

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "forum_posts");
      }
      const postsData: ForumPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postsData.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          authorName: data.authorName || "Anonymous",
          authorEmail: data.authorEmail || "",
          createdAt: data.createdAt || new Date().toISOString(),
          lessonId: data.lessonId || "general",
          upvotes: data.upvotes || 0,
          upvotedBy: data.upvotedBy || [],
          replyCount: data.replyCount || 0
        });
      });
      setPosts(postsData);

      // Refresh currently selected post details if it exists
      if (selectedPost) {
        const updatedSelected = postsData.find(p => p.id === selectedPost.id);
        if (updatedSelected) setSelectedPost(updatedSelected);
      }
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError("Unable to load discussion posts. Ensure database is configured.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filterMode, activeLessonId]);

  // Load replies for a post
  const fetchReplies = async (postId: string) => {
    setLoadingReplies(true);
    try {
      const repliesRef = collection(db, `forum_posts/${postId}/replies`);
      const q = query(repliesRef, orderBy("createdAt", "asc"));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `forum_posts/${postId}/replies`);
      }
      const repliesData: ForumReply[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        repliesData.push({
          id: doc.id,
          postId,
          content: data.content || "",
          authorName: data.authorName || "Anonymous",
          authorEmail: data.authorEmail || "",
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      setReplies(repliesData);
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSelectPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchReplies(post.id);
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const postPayload = {
        title: newPostTitle,
        content: newPostContent,
        authorName: currentStudent.name,
        authorEmail: currentStudent.email,
        createdAt: new Date().toISOString(),
        lessonId: activeLessonId || "general",
        upvotes: 0,
        upvotedBy: [],
        replyCount: 0
      };

      try {
        await addDoc(collection(db, "forum_posts"), postPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "forum_posts");
      }
      setNewPostTitle("");
      setNewPostContent("");
      setIsCreatingPost(false);
      fetchPosts();
    } catch (err) {
      console.error("Error adding post:", err);
      setError("Failed to create post. Please try again.");
    }
  };

  // Submit reply
  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !selectedPost) return;
    if (!newReplyContent.trim()) return;

    try {
      const replyPayload = {
        postId: selectedPost.id,
        content: newReplyContent,
        authorName: currentStudent.name,
        authorEmail: currentStudent.email,
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, `forum_posts/${selectedPost.id}/replies`), replyPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `forum_posts/${selectedPost.id}/replies`);
      }
      
      // Update reply count on parent post
      const postRef = doc(db, "forum_posts", selectedPost.id);
      try {
        await updateDoc(postRef, {
          replyCount: increment(1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `forum_posts/${selectedPost.id}`);
      }

      setNewReplyContent("");
      fetchReplies(selectedPost.id);
      fetchPosts(); // Refresh list to show updated count
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  // Upvote toggle
  const handleToggleUpvote = async (post: ForumPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStudent) return;

    const postRef = doc(db, "forum_posts", post.id);
    const hasUpvoted = (post.upvotedBy || []).includes(currentStudent.email);

    try {
      if (hasUpvoted) {
        // Remove upvote
        try {
          await updateDoc(postRef, {
            upvotes: increment(-1),
            upvotedBy: arrayRemove(currentStudent.email)
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `forum_posts/${post.id}`);
        }
      } else {
        // Add upvote
        try {
          await updateDoc(postRef, {
            upvotes: increment(1),
            upvotedBy: arrayUnion(currentStudent.email)
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `forum_posts/${post.id}`);
        }
      }
      fetchPosts();
    } catch (err) {
      console.error("Error toggling upvote:", err);
    }
  };

  const getCleanTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <div id="forum-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-500" />
            Classroom Discussion Board
          </h3>
          <p className="text-sm text-slate-500 mt-1">Ask questions, share your marketing sandboxes, and get peer reviews.</p>
        </div>

        {currentStudent && (
          <button 
            id="btn-forum-toggle-create"
            onClick={() => setIsCreatingPost(!isCreatingPost)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {isCreatingPost ? "Cancel New Post" : "Ask a Question"}
          </button>
        )}
      </div>

      {!currentStudent ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Student Profile Required</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Please enroll above and complete your profile to ask questions, vote, and reply to class peers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Forum Side (Left/List) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters:
              </span>
              <button 
                id="btn-forum-filter-all"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${filterMode === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                All Modules
              </button>
              <button 
                id="btn-forum-filter-lesson"
                onClick={() => setFilterMode("lesson")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${filterMode === "lesson" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Current Lesson Only
              </button>
            </div>

            {/* Create Post Form */}
            {isCreatingPost && (
              <form id="form-forum-new-post" onSubmit={handleCreatePost} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Write Your Question / Post</h4>
                <div className="space-y-1">
                  <input 
                    id="input-forum-new-title"
                    type="text" 
                    placeholder="e.g. Need feedback on my Facebook Ad Copy copy"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <textarea 
                    id="input-forum-new-content"
                    rows={4}
                    placeholder="Explain what you are working on, or paste your copy/sandbox results..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 resize-none"
                    required
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono">Posting to: {activeLessonId ? `Lesson ${activeLessonId.replace("lesson-", "")}` : "General"}</span>
                  <div className="flex gap-2">
                    <button 
                      id="btn-forum-cancel-new"
                      type="button" 
                      onClick={() => setIsCreatingPost(false)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button 
                      id="btn-forum-submit-new"
                      type="submit"
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" /> Post Thread
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                <p className="text-xs">Connecting to Classroom Board...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200/80">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Discussions Yet</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to post a query or feedback for this module!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => {
                  const hasUpvoted = (post.upvotedBy || []).includes(currentStudent?.email || "");
                  return (
                    <div 
                      key={post.id}
                      id={`forum-post-card-${post.id}`}
                      onClick={() => handleSelectPost(post)}
                      className={`p-4 rounded-xl border transition-all text-left cursor-pointer flex gap-3 ${selectedPost?.id === post.id ? "bg-sky-50/20 border-sky-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}
                    >
                      {/* Upvote side button */}
                      <button 
                        id={`btn-forum-upvote-${post.id}`}
                        onClick={(e) => handleToggleUpvote(post, e)}
                        className={`flex flex-col items-center justify-center border rounded-lg p-2 w-11 h-12 self-start shrink-0 transition ${hasUpvoted ? "bg-sky-50 border-sky-300 text-sky-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700"}`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-sky-600 text-sky-600" : ""}`} />
                        <span className="text-[10px] font-bold font-mono mt-1">{post.upvotes}</span>
                      </button>

                      {/* Post body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-1">
                          <span className="font-bold text-slate-600 flex items-center gap-1"><User className="w-2.5 h-2.5" /> {post.authorName}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {getCleanTime(post.createdAt)}</span>
                          {post.lessonId !== "general" && (
                            <>
                              <span>&bull;</span>
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold text-[9px]">Lesson {post.lessonId.replace("lesson-", "").replace("-", ".")}</span>
                            </>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{post.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{post.content}</p>
                        
                        <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1 hover:text-slate-600">
                            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                            {post.replyCount || 0} peer {post.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 self-center shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat/Thread View (Right Side) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-200/60 p-4 min-h-[400px] flex flex-col">
            {selectedPost ? (
              <div className="flex flex-col h-full flex-1">
                {/* Thread Header */}
                <div className="border-b border-slate-200 pb-3 mb-3 text-left">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                    <span className="font-bold text-slate-600">{selectedPost.authorName}</span>
                    <span>&bull;</span>
                    <span>{getCleanTime(selectedPost.createdAt)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedPost.title}</h4>
                  <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                    {selectedPost.content}
                  </p>
                </div>

                {/* Replies Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Replies thread</span>
                  {loadingReplies ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                      Loading responses...
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No replies on this thread. Be the first to share feedback!</p>
                  ) : (
                    replies.map((rep) => (
                      <div key={rep.id} className="bg-white border border-slate-200/80 p-3 rounded-xl flex gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mb-1">
                            <span className="font-bold text-slate-700">{rep.authorName}</span>
                            <span>&bull;</span>
                            <span>{getCleanTime(rep.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{rep.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form id="form-forum-new-reply" onSubmit={handleCreateReply} className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                  <input 
                    id="input-forum-reply-content"
                    type="text" 
                    placeholder="Write a constructive review or reply..."
                    value={newReplyContent}
                    onChange={(e) => setNewReplyContent(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    required
                  />
                  <button 
                    id="btn-forum-submit-reply"
                    type="submit"
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 my-auto">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Post Selected</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Click any classroom query on the left to read replies and collaborate.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
