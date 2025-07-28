import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "../components/ui/menubar";
import { useAdminAuth } from "../hooks/useAdminAuth";

function AdminDashboard() {
  useAdminAuth(); // Protect the dashboard

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [activeView, setActiveView] = useState("posts");

  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostPetName, setEditingPostPetName] = useState("");
  const [editingPostAnalysisResult, setEditingPostAnalysisResult] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    await fetchPosts();
    await fetchComments();
    await fetchLikes();
    await fetchAnalysisHistory();
  }

  

  async function fetchPosts() {
    const { data, error } = await supabase.from("newsfeed_posts").select("*");
    if (error) {
      console.error("Error fetching posts:", error.message);
    } else {
      setPosts(data);
    }
  }

  async function fetchComments() {
    const { data, error } = await supabase.from("newsfeed_comments").select("*");
    if (error) {
      console.error("Error fetching comments:", error.message);
    } else {
      setComments(data);
    }
  }

  async function fetchLikes() {
    const { data, error } = await supabase.from("newsfeed_likes").select("*");
    if (error) {
      console.error("Error fetching likes:", error.message);
    } else {
      setLikes(data);
    }
  }

  async function fetchAnalysisHistory() {
    const { data, error } = await supabase.from("analysis_history").select("*");
    if (error) {
      console.error("Error fetching analysis history:", error.message);
    } else {
      setAnalysisHistory(data);
    }
  }

  async function handleDeletePost(id) {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const { error } = await supabase.from("newsfeed_posts").delete().eq("id", id);
      if (error) {
        console.error("Error deleting post:", error.message);
      } else {
        fetchPosts(); // Re-fetch posts to update the list
      }
    }
  }

  async function handleDeleteComment(id) {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      const { error } = await supabase.from("newsfeed_comments").delete().eq("id", id);
      if (error) {
        console.error("Error deleting comment:", error.message);
      } else {
        fetchComments(); // Re-fetch comments to update the list
      }
    }
  }

  function handleEditPost(post) {
    setEditingPostId(post.id);
    setEditingPostPetName(post.pet_name || "");
    setEditingPostAnalysisResult(post.analysis_result || "");
  }

  async function handleSavePost(id) {
    const { error } = await supabase
      .from("newsfeed_posts")
      .update({
        pet_name: editingPostPetName,
        analysis_result: editingPostAnalysisResult,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating post:", error.message);
    } else {
      setEditingPostId(null); // Exit editing mode
      fetchPosts(); // Re-fetch posts to update the list
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Menubar className="mb-4">
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("posts")}>Posts</MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("comments")}>Comments</MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("likes")}>Likes</MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("analysisHistory")}>Analysis History</MenubarTrigger>
        </MenubarMenu>
      </Menubar>

      {activeView === "posts" && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Newsfeed Posts</h2>
        <Table>
          <TableCaption>A list of newsfeed posts.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Image URL</TableHead>
              <TableHead>Analysis Result</TableHead>
              <TableHead>Pet Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Anonymous</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.id}</TableCell>
                <TableCell>
                  <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Link
                  </a>
                </TableCell>
                <TableCell>
                  {editingPostId === post.id ? (
                    <Input
                      value={editingPostAnalysisResult}
                      onChange={(e) => setEditingPostAnalysisResult(e.target.value)}
                    />
                  ) : (
                    post.analysis_result
                  )}
                </TableCell>
                <TableCell>
                  {editingPostId === post.id ? (
                    <Input
                      value={editingPostPetName}
                      onChange={(e) => setEditingPostPetName(e.target.value)}
                    />
                  ) : (
                    post.pet_name
                  )}
                </TableCell>
                <TableCell>{post.display_name}</TableCell>
                <TableCell>{post.is_anonymous ? "Yes" : "No"}</TableCell>
                <TableCell>{new Date(post.created_at).toLocaleString()}</TableCell>
                <TableCell className="flex space-x-2">
                  {editingPostId === post.id ? (
                    <Button onClick={() => handleSavePost(post.id)}>Save</Button>
                  ) : (
                    <Button onClick={() => handleEditPost(post)}>Edit</Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDeletePost(post.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      )}

      {activeView === "comments" && (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Newsfeed Comments</h2>
        <Table>
          <TableCaption>A list of newsfeed comments.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Post ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Comment Text</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell className="font-medium">{comment.id}</TableCell>
                <TableCell>{comment.post_id}</TableCell>
                <TableCell>{comment.display_name}</TableCell>
                <TableCell>{comment.comment_text}</TableCell>
                <TableCell>{comment.role}</TableCell>
                <TableCell>{new Date(comment.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="destructive" onClick={() => handleDeleteComment(comment.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      )}

      {activeView === "likes" && (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Newsfeed Likes</h2>
        <Table>
          <TableCaption>A list of newsfeed likes.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Post ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {likes.map((like) => (
              <TableRow key={like.id}>
                <TableCell className="font-medium">{like.id}</TableCell>
                <TableCell>{like.post_id}</TableCell>
                <TableCell>{userDisplayNames[like.user_id] || "N/A"}</TableCell>
                <TableCell>{new Date(like.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      )}

      {activeView === "analysisHistory" && (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Analysis History</h2>
        <Table>
          <TableCaption>A list of analysis history entries.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Image URL</TableHead>
              <TableHead>Analysis Result</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysisHistory.map((analysis) => (
              <TableRow key={analysis.id}>
                <TableCell className="font-medium">{analysis.id}</TableCell>
                <TableCell>{analysis.user_id ? userDisplayNames[analysis.user_id] : "Anonymous"}</TableCell>
                <TableCell>
                  <a href={analysis.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Link
                  </a>
                </TableCell>
                <TableCell>{analysis.analysis_result}</TableCell>
                <TableCell>{new Date(analysis.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      )}
    </div>
  );
}

export default AdminDashboard;
