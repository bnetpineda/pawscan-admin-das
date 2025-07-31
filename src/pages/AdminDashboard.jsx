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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
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
  const [
    editingPostAnalysisResult,
    setEditingPostAnalysisResult,
  ] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchDisplayNames = async () => {
      const userIds = [
        ...new Set([
          ...analysisHistory
            .map((analysis) => analysis.user_id)
            .filter(Boolean),
        ]),
      ];

      if (userIds.length === 0) return;

      // This calls the Supabase database function `get_user_display_names`
      const { data: users, error } = await supabase.rpc(
        "get_user_display_names",
        { user_ids: userIds }
      );

      if (error) {
        console.error("Error fetching user display names:", error);
        return;
      }

      if (users) {
        const names = users.reduce((acc, user) => {
          acc[user.id] = user.display_name;
          return acc;
        }, {});
        setUserDisplayNames(names);
      }
    };

    fetchDisplayNames();
  }, [analysisHistory]);

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
    const { data, error } = await supabase
      .from("newsfeed_comments")
      .select("*");
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
    const { data, error } = await supabase
      .from("analysis_history")
      .select("*");
    if (error) {
      console.error("Error fetching analysis history:", error.message);
    } else {
      setAnalysisHistory(data);
    }
  }

  const confirmDelete = (id, action) => {
    setItemToDelete(id);
    setDeleteAction(() => action);
    setDialogOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete && deleteAction) {
      await deleteAction(itemToDelete);
    }
    setDialogOpen(false);
    setItemToDelete(null);
    setDeleteAction(null);
  };

  async function handleDeletePost(id) {
    const { error } = await supabase
      .from("newsfeed_posts")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting post:", error.message);
    } else {
      fetchPosts();
    }
  }

  async function handleDeleteComment(id) {
    const { error } = await supabase
      .from("newsfeed_comments")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting comment:", error.message);
    } else {
      fetchComments();
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

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  };

  const formatAnalysisResult = (text) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
      <ol className="list-decimal list-inside">
        {lines.map((line, index) => (
          <li key={index}>{line.replace(/^\d+\.\s*/, '')}</li>
        ))}
      </ol>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Menubar className="mb-4">
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("posts")}>
            Posts
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("comments")}>
            Comments
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("likes")}>
            Likes
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => setActiveView("analysisHistory")}>
            Analysis History
          </MenubarTrigger>
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
                    <a
                      href={post.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Link
                    </a>
                  </TableCell>
                  <TableCell>
                    {editingPostId === post.id ? (
                      <Input
                        value={editingPostAnalysisResult}
                        onChange={(e) =>
                          setEditingPostAnalysisResult(e.target.value)
                        }
                      />
                    ) : (
                      <Popover>
                        <PopoverTrigger>
                          {truncateText(post.analysis_result, 50)}
                        </PopoverTrigger>
                        <PopoverContent>
                          {formatAnalysisResult(post.analysis_result)}
                        </PopoverContent>
                      </Popover>
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
                  <TableCell>
                    {new Date(post.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    {editingPostId === post.id ? (
                      <Button onClick={() => handleSavePost(post.id)}>
                        Save
                      </Button>
                    ) : (
                      <Button onClick={() => handleEditPost(post)}>Edit</Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => confirmDelete(post.id, handleDeletePost)}
                    >
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
                  <TableCell>
                    {new Date(comment.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => confirmDelete(comment.id, handleDeleteComment)}
                    >
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
                <TableHead>User ID</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {likes.map((like) => (
                <TableRow key={like.id}>
                  <TableCell className="font-medium">{like.id}</TableCell>
                  <TableCell>{like.post_id}</TableCell>
                  <TableCell>{like.user_id}</TableCell>
                  <TableCell>
                    {new Date(like.created_at).toLocaleString()}
                  </TableCell>
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
                  <TableCell>
                    {analysis.user_id
                      ? userDisplayNames[analysis.user_id]
                      : "Anonymous"}
                  </TableCell>
                  <TableCell>
                    <a
                      href={analysis.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Link
                    </a>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger>
                        {truncateText(analysis.analysis_result, 50)}
                      </PopoverTrigger>
                      <PopoverContent>
                        {formatAnalysisResult(analysis.analysis_result)}
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    {new Date(analysis.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminDashboard;
