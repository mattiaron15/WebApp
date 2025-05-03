// Check if user is logged in
const checkAuth = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get current user ID
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || '';
};

// Update UI based on authentication status
const updateAuthUI = () => {
  const isLoggedIn = checkAuth();
  const loginElements = document.querySelectorAll('.login-required');
  const logoutElements = document.querySelectorAll('.logout-required');
  
  loginElements.forEach(el => {
    el.style.display = isLoggedIn ? 'block' : 'none';
  });
  
  logoutElements.forEach(el => {
    el.style.display = isLoggedIn ? 'none' : 'block';
  });
};

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  
  // Includi sia il formato Bearer che x-auth-token per maggiore compatibilità
  return {
    'Authorization': `Bearer ${token}`,
    'x-auth-token': token,
    'Content-Type': 'application/json'
  };
};

// Handle logout
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Truncate text
const truncateText = (text, length) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Handle like action
const handleLike = async (postId) => {
  if (!checkAuth()) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      const likeCount = document.getElementById(`likes-count-${postId}`);
      const likeButton = document.getElementById(`like-button-${postId}`);
      
      if (likeCount) {
        // Aggiorna il contatore con il valore preciso dal server
        likeCount.textContent = data.likesCount;
      }
      
      if (likeButton) {
        // Aggiorna l'icona in base allo stato del like
        const heartIcon = likeButton.querySelector('i');
        if (heartIcon) {
          if (data.isLiked) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            likeButton.classList.add('active');
          } else {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            likeButton.classList.remove('active');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

// Handle comment submission
const handleCommentSubmit = async (postId, form) => {
  if (!checkAuth()) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const content = form.elements.content.value;
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        content,
        postId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reset form
      form.reset();
      
      // Reload comments
      await loadComments(postId);
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
  }
};

// Load comments for a post
const loadComments = async (postId) => {
  try {
    const response = await fetch(`/api/comments/post/${postId}`);
    const data = await response.json();
    
    if (data.success) {
      const commentsContainer = document.getElementById('comments-container');
      
      if (commentsContainer) {
        commentsContainer.innerHTML = '';
        
        if (data.count > 0) {
          const currentUserId = getUserId();
          
          data.data.forEach(comment => {
            const date = formatDate(comment.createdAt);
            // Check if the current user has liked this comment
            let userHasLiked = false;
            if (comment.likes && Array.isArray(comment.likes)) {
              userHasLiked = comment.likes.some(like => {
                if (typeof like === 'string') {
                  return like === currentUserId;
                } else if (like && like._id) {
                  return like._id === currentUserId;
                }
                return false;
              });
            }
            
            const heartIcon = userHasLiked ? 'fas fa-heart' : 'far fa-heart';
            const buttonClass = userHasLiked ? 'btn btn-sm active' : 'btn btn-sm';
            
            commentsContainer.innerHTML += `
              <div class="comment" id="comment-${comment._id}">
                <div class="comment-header">
                  <img src="${comment.author.profilePicture}" alt="${comment.author.username}" class="comment-avatar">
                  <div>
                    <h6 class="mb-0">${comment.author.username}</h6>
                    <small class="text-muted">${date}</small>
                  </div>
                </div>
                <div class="comment-content">
                  <p>${comment.content}</p>
                  <div class="d-flex align-items-center">
                    <button class="${buttonClass}" onclick="handleCommentLike('${comment._id}')">
                      <i class="${heartIcon}"></i> <span id="comment-likes-${comment._id}">${comment.likes.length}</span>
                    </button>
                    <button class="btn btn-sm" onclick="toggleReplyForm('${comment._id}')">
                      <i class="far fa-comment"></i> Reply
                    </button>
                  </div>
                  <div id="reply-form-${comment._id}" class="mt-2" style="display: none;">
                    <form onsubmit="event.preventDefault(); handleReply('${postId}', '${comment._id}', this)">
                      <div class="form-group">
                        <textarea class="form-control" name="content" rows="2" required></textarea>
                      </div>
                      <button type="submit" class="btn btn-sm btn-primary mt-2">Submit Reply</button>
                    </form>
                  </div>
                </div>
                <div class="replies" id="replies-${comment._id}"></div>
              </div>
            `;
          });
        } else {
          commentsContainer.innerHTML = '<p>Nessun commento ancora. Sii il primo a commentare!</p>';
        }
      }
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
};

// Handle comment like action
const handleCommentLike = async (commentId) => {
  if (!checkAuth()) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      const likeCount = document.getElementById(`comment-likes-${commentId}`);
      const likeButton = document.querySelector(`button[onclick="handleCommentLike('${commentId}')"]`);
      
      if (likeCount) {
        // Aggiorna il contatore con il valore preciso dal server
        likeCount.textContent = data.likesCount;
      }
      
      if (likeButton) {
        // Aggiorna l'icona in base allo stato del like
        const heartIcon = likeButton.querySelector('i');
        if (heartIcon) {
          if (data.isLiked) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            likeButton.classList.add('active');
          } else {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            likeButton.classList.remove('active');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error liking comment:', error);
  }
};

// Toggle reply form visibility
const toggleReplyForm = (commentId) => {
  const replyForm = document.getElementById(`reply-form-${commentId}`);
  if (replyForm) {
    replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
  }
};

// Handle reply submission
const handleReply = async (postId, commentId, form) => {
  if (!checkAuth()) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const content = form.elements.content.value;
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        content,
        postId,
        parentCommentId: commentId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reset form
      form.reset();
      
      // Hide the reply form
      toggleReplyForm(commentId);
      
      // Load the replies for this comment
      await loadReplies(commentId);
    }
  } catch (error) {
    console.error('Error submitting reply:', error);
  }
};

// Load replies for a comment
const loadReplies = async (commentId) => {
  try {
    const response = await fetch(`/api/comments/${commentId}/replies`);
    const data = await response.json();
    
    if (data.success) {
      const repliesContainer = document.getElementById(`replies-${commentId}`);
      
      if (repliesContainer) {
        repliesContainer.innerHTML = '';
        
        if (data.count > 0) {
          const currentUserId = getUserId();
          
          data.data.forEach(reply => {
            const date = formatDate(reply.createdAt);
            
            // Check if the current user has liked this reply
            let userHasLiked = false;
            if (reply.likes && Array.isArray(reply.likes)) {
              userHasLiked = reply.likes.some(like => {
                if (typeof like === 'string') {
                  return like === currentUserId;
                } else if (like && like._id) {
                  return like._id === currentUserId;
                }
                return false;
              });
            }
            
            const heartIcon = userHasLiked ? 'fas fa-heart' : 'far fa-heart';
            const buttonClass = userHasLiked ? 'btn btn-sm active' : 'btn btn-sm';
            
            repliesContainer.innerHTML += `
              <div class="comment reply" id="comment-${reply._id}">
                <div class="comment-header">
                  <img src="${reply.author.profilePicture}" alt="${reply.author.username}" class="comment-avatar">
                  <div>
                    <h6 class="mb-0">${reply.author.username}</h6>
                    <small class="text-muted">${date}</small>
                  </div>
                </div>
                <div class="comment-content">
                  <p>${reply.content}</p>
                  <div class="d-flex align-items-center">
                    <button class="${buttonClass}" onclick="handleCommentLike('${reply._id}')">
                      <i class="${heartIcon}"></i> <span id="comment-likes-${reply._id}">${reply.likes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading replies:', error);
  }
};

// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  // Check for saved theme preference or use default light theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Apply theme toggle button functionality
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
      // Get current theme and toggle it
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Update HTML attribute and save preference
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
  
  // Initialize other functionalities (user auth, etc.)
  updateAuthUI();
  
  // Add event listeners for logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleLogout();
    });
  }
}); 