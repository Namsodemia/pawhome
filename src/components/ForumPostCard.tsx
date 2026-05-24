"use client";

import { useState } from "react";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  user: { name: string };
};

export function ForumPostCard({
  post,
}: {
  post: {
    id: number;
    title: string;
    content: string;
    category: string;
    categoryLabel: string;
    categoryColor: string;
    isPinned: boolean;
    createdAtAgo: string;
    authorName: string;
    authorInitials: string;
    likes: number;
    comments: number;
    likedByMe: boolean;
  };
}) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.likedByMe);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function toggleLike() {
    // Optimistic
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) {
      // Revert
      setLiked(liked);
      setLikes(likes);
      return;
    }
    const data = await res.json();
    setLiked(data.liked);
    setLikes(data.count);
  }

  async function openComments() {
    if (!commentsOpen) {
      setCommentsOpen(true);
      if (!comments) {
        setCommentsLoading(true);
        const res = await fetch(`/api/posts/${post.id}/comments`);
        const data = await res.json();
        setComments(data.comments ?? []);
        setCommentsLoading(false);
      }
    } else {
      setCommentsOpen(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [...(prev ?? []), comment]);
      setCommentCount((c) => c + 1);
      setNewComment("");
    }
  }

  return (
    <article
      className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border ${
        post.isPinned ? "border-pw-primary/30 ring-1 ring-pw-primary/10" : "border-slate-100"
      } transition-transform`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
            {post.authorInitials}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
              {post.authorName}
              {post.isPinned && (
                <i className="fa-solid fa-thumbtack text-[8px] text-pw-primary"></i>
              )}
            </p>
            <p className="text-[10px] text-slate-400">{post.createdAtAgo}</p>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md ${post.categoryColor} text-[9px] font-bold uppercase tracking-wide border`}
        >
          {post.categoryLabel}
        </span>
      </div>

      <h2 className="text-sm font-bold text-slate-800 mb-2 leading-snug">{post.title}</h2>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">{post.content}</p>

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex gap-1.5">
          <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            #{post.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition-colors active:scale-95 ${
              liked ? "text-pw-primary" : "text-slate-400 hover:text-pw-primary"
            }`}
          >
            <i className={`${liked ? "fa-solid" : "fa-regular"} fa-thumbs-up`}></i>
            <span className="font-semibold">{likes}</span>
          </button>
          <button
            onClick={openComments}
            className={`flex items-center gap-1 transition-colors active:scale-95 ${
              commentsOpen ? "text-pw-primary" : "text-slate-400 hover:text-pw-primary"
            }`}
          >
            <i className="fa-regular fa-comment"></i>
            <span className="font-semibold">{commentCount}</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="border-t border-slate-100 mt-3 pt-3 space-y-3">
          {commentsLoading ? (
            <div className="text-center text-xs text-slate-400 py-3">Yükleniyor...</div>
          ) : (
            <>
              {(comments ?? []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">İlk yorumu sen yap.</p>
              ) : (
                (comments ?? []).map((c) => (
                  <div key={c.id} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-[9px] font-bold text-pw-primary shrink-0">
                      {c.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 rounded-2xl px-3 py-2 flex-1">
                      <div className="text-[10px] font-bold text-slate-700 mb-0.5">
                        {c.user.name}
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <form onSubmit={addComment} className="flex gap-2 mt-3">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorum yaz..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pw-primary"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="w-9 h-9 bg-pw-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
                  aria-label="Gönder"
                >
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </article>
  );
}
