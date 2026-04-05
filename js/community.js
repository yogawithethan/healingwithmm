/* js/community.js — Reddit-style community forum logic */

(function () {
  var TOPICS = [
    { id: '369-cleanse', name: '3:6:9 Cleanse Journey', emoji: '\u{1F9C3}' },
    { id: 'symptoms', name: 'Symptom Discussions', emoji: '\u{1FA7A}' },
    { id: 'success', name: 'Success Stories', emoji: '\u2B50' },
    { id: 'recipes', name: 'Recipes & Tips', emoji: '\u{1F957}' },
    { id: 'general', name: 'General Questions', emoji: '\u{1F4AC}' }
  ];

  var currentTopic = null;
  var currentSort = 'new';
  var currentUser = null;
  var userVotes = {};
  var lastDoc = null;
  var loading = false;
  var currentPostId = null;
  var isSignUp = false;

  function timeAgo(ts) {
    if (!ts) return '';
    var date = ts.toDate ? ts.toDate() : new Date(ts);
    var diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString();
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function showToast(msg) {
    var el = document.getElementById('communityToast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  /* ── Auth Modal ── */
  window.openAuthModal = function () {
    document.getElementById('authOverlay').classList.add('show');
    document.getElementById('authModal').classList.add('show');
  };

  window.closeAuthModal = function () {
    document.getElementById('authOverlay').classList.remove('show');
    document.getElementById('authModal').classList.remove('show');
    document.getElementById('authError').style.display = 'none';
  };

  window.toggleAuthMode = function () {
    isSignUp = !isSignUp;
    var nameField = document.getElementById('authNameField');
    var submitBtn = document.getElementById('authSubmitBtn');
    var toggleText = document.getElementById('authToggleText');
    var toggleBtn = document.getElementById('authToggleBtn');
    var title = document.getElementById('authModalTitle');
    document.getElementById('authError').style.display = 'none';

    if (isSignUp) {
      nameField.style.display = 'block';
      submitBtn.textContent = 'Create account';
      title.textContent = 'Create account';
      toggleText.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign in';
    } else {
      nameField.style.display = 'none';
      submitBtn.textContent = 'Sign in';
      title.textContent = 'Sign in';
      toggleText.textContent = "Don't have an account?";
      toggleBtn.textContent = 'Sign up';
    }
  };

  function showAuthError(msg) {
    var el = document.getElementById('authError');
    el.textContent = msg;
    el.style.display = 'block';
  }

  auth.onAuthStateChanged(function (user) {
    currentUser = user;
    var fab = document.getElementById('communityFab');

    /* Swap nav sign-in button / profile icon */
    var navSignIn = document.getElementById('navSignIn');
    var navProfileIcon = document.getElementById('navProfileIcon');
    if (navSignIn && navProfileIcon) {
      if (user) {
        var name = user.displayName || user.email || 'User';
        navSignIn.classList.add('nav-signin--hidden');
        navProfileIcon.classList.remove('nav-profile--hidden');
        navProfileIcon.textContent = name.charAt(0).toUpperCase();
        navProfileIcon.title = 'Signed in as ' + name;
      } else {
        navSignIn.classList.remove('nav-signin--hidden');
        navProfileIcon.classList.add('nav-profile--hidden');
        navSignIn.onclick = function (e) { e.preventDefault(); openAuthModal(); };
      }
    }

    if (user) {
      fab.classList.remove('hidden');
      closeAuthModal();
    } else {
      fab.classList.add('hidden');
      userVotes = {};
    }
    document.querySelectorAll('.community-vote__btn').forEach(function (btn) {
      var pid = btn.dataset.postId;
      btn.classList.toggle('voted', !!userVotes[pid]);
    });
  });

  window.communitySignIn = function () {
    var email = document.getElementById('authEmail').value.trim();
    var password = document.getElementById('authPassword').value;
    document.getElementById('authError').style.display = 'none';

    if (!email || !password) { showAuthError('Email and password are required'); return; }

    if (isSignUp) {
      var displayName = document.getElementById('authDisplayName').value.trim();
      if (!displayName) { showAuthError('Display name is required'); return; }
      auth.createUserWithEmailAndPassword(email, password).then(function (result) {
        return result.user.updateProfile({ displayName: displayName }).then(function () {
          db.collection('users').doc(result.user.uid).set({
            displayName: displayName, email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
      }).catch(function (err) {
        var msg = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
          : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
          : err.code === 'auth/invalid-email' ? 'Invalid email address' : err.message;
        showAuthError(msg);
      });
    } else {
      auth.signInWithEmailAndPassword(email, password).catch(function (err) {
        var msg = err.code === 'auth/user-not-found' ? 'No account found with this email'
          : err.code === 'auth/wrong-password' ? 'Incorrect password'
          : err.code === 'auth/invalid-credential' ? 'Incorrect email or password' : err.message;
        showAuthError(msg);
      });
    }
  };

  window.communitySignOut = function () { auth.signOut(); };

  /* ── Seed topics ── */
  TOPICS.forEach(function (t) {
    db.collection('topics').doc(t.id).set({
      name: t.name, emoji: t.emoji, postCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  /* ── Topic filter ── */
  window.setTopic = function (topicId, btn) {
    document.querySelectorAll('.community-topic').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentTopic = topicId === 'all' ? null : topicId;
    lastDoc = null;
    loadPosts(true);
  };

  /* ── Sort ── */
  window.setSort = function (sort, btn) {
    document.querySelectorAll('.community-sort__btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentSort = sort;
    lastDoc = null;
    loadPosts(true);
  };

  /* ── Load posts — simple query, no composite index needed ── */
  function loadPosts(reset) {
    if (loading) return;
    loading = true;
    var feed = document.getElementById('communityFeed');

    if (reset) {
      feed.innerHTML = '<div class="community-skeleton"><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div></div>'.repeat(3);
      lastDoc = null;
    }

    /* Use simple orderBy queries to avoid composite index requirements */
    var orderField = currentSort === 'top' ? 'voteCount' : 'createdAt';
    var query = db.collection('posts').orderBy(orderField, 'desc').limit(20);

    if (lastDoc) query = query.startAfter(lastDoc);

    query.get().then(function (snap) {
      if (reset) feed.innerHTML = '';

      /* Client-side topic filter to avoid composite index */
      var docs = [];
      snap.forEach(function (doc) { docs.push(doc); });

      var filtered = currentTopic
        ? docs.filter(function (doc) { return doc.data().topicId === currentTopic; })
        : docs;

      if (!filtered.length && reset) {
        feed.innerHTML = '<div class="community-empty">'
          + '<div class="community-empty__icon">&#x1F331;</div>'
          + '<div class="community-empty__title">No posts yet</div>'
          + '<div class="community-empty__desc">Be the first to share your healing journey</div></div>';
        loading = false;
        return;
      }

      filtered.forEach(function (doc) {
        var p = doc.data();
        p.id = doc.id;
        feed.appendChild(renderPostCard(p));
      });

      if (docs.length > 0) lastDoc = docs[docs.length - 1];

      if (currentUser) {
        filtered.forEach(function (doc) { checkVote(doc.id); });
      }

      loading = false;
      var loadMore = document.getElementById('loadMore');
      if (loadMore) loadMore.style.display = snap.size < 20 ? 'none' : 'block';
    }).catch(function (err) {
      console.error('Error loading posts:', err);
      if (reset) feed.innerHTML = '<div class="community-empty"><div class="community-empty__title">Error loading posts</div><div class="community-empty__desc">' + esc(err.message) + '</div></div>';
      loading = false;
    });
  }

  window.loadMorePosts = function () { loadPosts(false); };

  function renderPostCard(p) {
    var el = document.createElement('div');
    el.className = 'community-post';
    el.onclick = function (e) {
      if (e.target.closest('.community-action')) return;
      openPost(p.id);
    };
    var topicObj = TOPICS.find(function (t) { return t.id === p.topicId; });
    var topicLabel = topicObj ? topicObj.emoji + ' ' + topicObj.name : p.topicName || '';
    var initial = (p.authorName || 'A').charAt(0).toUpperCase();
    var avatarInner = p.authorPhoto
      ? '<img src="' + esc(p.authorPhoto) + '" alt="">'
      : initial;

    el.innerHTML =
      /* Header: avatar + username + time */
      '<div class="community-post__header">'
      + '<div class="community-post__avatar">' + avatarInner + '</div>'
      + '<span class="community-post__author">' + esc(p.authorName || 'Anonymous') + '</span>'
      + '<span class="community-post__dot">&middot;</span>'
      + '<span class="community-post__time">' + timeAgo(p.createdAt) + '</span>'
      + '</div>'
      /* Topic badge */
      + '<div class="community-post__topic">' + esc(topicLabel) + '</div>'
      /* Title */
      + '<div class="community-post__title">' + esc(p.title) + '</div>'
      /* Body preview */
      + (p.body ? '<div class="community-post__preview">' + esc(p.body) + '</div>' : '')
      /* Action bar: vote + comments + share pills */
      + '<div class="community-post__actions">'
      + '<button class="community-action' + (userVotes[p.id] ? ' voted' : '') + '" data-post-id="' + p.id + '" onclick="event.stopPropagation();toggleVote(\'' + p.id + '\',this)">'
      + '<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>'
      + '<span id="vc-' + p.id + '">' + (p.voteCount || 0) + '</span></button>'
      + '<button class="community-action" onclick="event.stopPropagation();openPost(\'' + p.id + '\')">'
      + '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      + (p.commentCount || 0) + '</button>'
      + '</div>';
    return el;
  }

  /* ── Voting ── */
  function checkVote(postId) {
    if (!currentUser) return;
    db.collection('posts').doc(postId).collection('votes').doc(currentUser.uid).get().then(function (doc) {
      if (doc.exists) {
        userVotes[postId] = true;
        var btn = document.querySelector('.community-vote__btn[data-post-id="' + postId + '"]');
        if (btn) btn.classList.add('voted');
      }
    });
  }

  window.toggleVote = function (postId, btn) {
    if (!currentUser) { showToast('Sign in to upvote'); openAuthModal(); return; }
    var voteRef = db.collection('posts').doc(postId).collection('votes').doc(currentUser.uid);
    var postRef = db.collection('posts').doc(postId);

    if (userVotes[postId]) {
      voteRef.delete();
      postRef.update({ voteCount: firebase.firestore.FieldValue.increment(-1) });
      userVotes[postId] = false;
      btn.classList.remove('voted');
      var c = document.getElementById('vc-' + postId);
      if (c) c.textContent = Math.max(0, parseInt(c.textContent) - 1);
    } else {
      voteRef.set({ userId: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      postRef.update({ voteCount: firebase.firestore.FieldValue.increment(1) });
      userVotes[postId] = true;
      btn.classList.add('voted');
      var c2 = document.getElementById('vc-' + postId);
      if (c2) c2.textContent = parseInt(c2.textContent) + 1;
    }
  };

  /* ── New post ── */
  window.openNewPost = function () {
    if (!currentUser) { showToast('Sign in to post'); openAuthModal(); return; }
    document.getElementById('sheetOverlay').classList.add('show');
    document.getElementById('newPostSheet').classList.add('show');
  };
  window.closeNewPost = function () {
    document.getElementById('sheetOverlay').classList.remove('show');
    document.getElementById('newPostSheet').classList.remove('show');
  };

  window.submitPost = function () {
    var title = document.getElementById('postTitle').value.trim();
    var topicId = document.getElementById('postTopic').value;
    var body = document.getElementById('postBody').value.trim();
    if (!title || !topicId) { showToast('Title and topic are required'); return; }

    var btn = document.getElementById('postSubmit');
    btn.disabled = true; btn.textContent = 'Posting...';
    var topicObj = TOPICS.find(function (t) { return t.id === topicId; });

    db.collection('posts').add({
      title: title, body: body, topicId: topicId,
      topicName: topicObj ? topicObj.name : '',
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      voteCount: 0, commentCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      db.collection('topics').doc(topicId).update({
        postCount: firebase.firestore.FieldValue.increment(1)
      }).catch(function () {});
      document.getElementById('postTitle').value = '';
      document.getElementById('postBody').value = '';
      btn.disabled = false; btn.textContent = 'Share with community';
      closeNewPost();
      showToast('Post shared');
      loadPosts(true);
    }).catch(function (err) {
      showToast('Error: ' + err.message);
      btn.disabled = false; btn.textContent = 'Share with community';
    });
  };

  /* ── Post detail ── */
  function openPost(postId) {
    currentPostId = postId;
    document.getElementById('communityFeedWrap').classList.add('hidden');
    var detail = document.getElementById('communityDetail');
    detail.classList.add('show');
    detail.innerHTML = '<div class="community-skeleton"><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div></div>';
    window.scrollTo(0, 0);

    db.collection('posts').doc(postId).get().then(function (doc) {
      if (!doc.exists) { detail.innerHTML = '<p>Post not found.</p>'; return; }
      var p = doc.data();
      var topicObj = TOPICS.find(function (t) { return t.id === p.topicId; });
      var topicLabel = topicObj ? topicObj.emoji + ' ' + topicObj.name : '';
      var initial = (p.authorName || 'A').charAt(0).toUpperCase();
      var avatarInner = p.authorPhoto
        ? '<img src="' + esc(p.authorPhoto) + '" alt="">'
        : initial;

      var h = '<button class="community-detail__back" onclick="closePost()">'
        + '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Back</button>'
        /* Post header: avatar + author + time */
        + '<div class="community-detail__post-header">'
        + '<div class="community-post__avatar">' + avatarInner + '</div>'
        + '<span class="community-post__author">' + esc(p.authorName || 'Anonymous') + '</span>'
        + '<span class="community-post__dot">&middot;</span>'
        + '<span class="community-post__time">' + timeAgo(p.createdAt) + '</span>'
        + '</div>'
        + '<div class="community-detail__topic">' + esc(topicLabel) + '</div>'
        + '<div class="community-detail__title">' + esc(p.title) + '</div>'
        + '<div class="community-detail__body">' + esc(p.body || '') + '</div>'
        /* Action bar */
        + '<div class="community-detail__actions">'
        + '<button class="community-action' + (userVotes[postId] ? ' voted' : '') + '" data-post-id="' + postId + '" onclick="toggleVote(\'' + postId + '\',this)">'
        + '<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>'
        + '<span id="vc-' + postId + '">' + (p.voteCount || 0) + '</span></button>'
        + '<span class="community-action"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        + (p.commentCount || 0) + '</span>'
        + '</div>'
        /* Comment input at top (like Reddit "Join the conversation") */
        + '<div class="community-comment-join">'
        + '<input class="community-comment-join__input" placeholder="Join the conversation..." readonly'
        + ' onclick="' + (currentUser ? "this.style.display=\'none\';document.getElementById(\'commentInputWrap\').style.display=\'flex\';document.getElementById(\'commentInput\').focus()" : "openAuthModal()") + '">'
        + '</div>'
        + '<div class="community-comments__header" id="commentHeader">Comments</div>'
        + '<div id="commentsList"></div>'
        /* Actual comment input */
        + '<div class="community-comment-input" id="commentInputWrap" style="' + (currentUser ? '' : 'display:none') + '">'
        + '<textarea class="community-comment-input__field" id="commentInput" placeholder="Write a comment..." rows="1"'
        + ' oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'"></textarea>'
        + '<button class="community-comment-input__send" onclick="submitComment()">'
        + '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>';

      detail.innerHTML = h;
      loadComments(postId);
      if (currentUser) checkVote(postId);
    });
  }

  window.closePost = function () {
    currentPostId = null;
    document.getElementById('communityFeedWrap').classList.remove('hidden');
    document.getElementById('communityDetail').classList.remove('show');
    window.scrollTo(0, 0);
  };

  /* ── Comments ── */
  function loadComments(postId) {
    db.collection('posts').doc(postId).collection('comments')
      .orderBy('createdAt', 'asc').onSnapshot(function (snap) {
        var list = document.getElementById('commentsList');
        if (!list) return;
        var header = document.getElementById('commentHeader');
        if (snap.empty) {
          list.innerHTML = '<div style="padding:16px 0;color:var(--text-muted);font-family:Outfit,sans-serif;font-size:13px">No comments yet. Be the first to respond.</div>';
          if (header) header.textContent = 'Comments';
          return;
        }
        if (header) header.textContent = snap.size + ' comment' + (snap.size !== 1 ? 's' : '');
        list.innerHTML = '';
        snap.forEach(function (doc) {
          var c = doc.data();
          var initial = (c.authorName || 'A').charAt(0).toUpperCase();
          var avatarInner = c.authorPhoto
            ? '<img src="' + esc(c.authorPhoto) + '" alt="">'
            : initial;
          var el = document.createElement('div');
          el.className = 'community-comment';
          el.innerHTML = '<div class="community-comment__header">'
            + '<div class="community-comment__avatar">' + avatarInner + '</div>'
            + '<span class="community-comment__author">' + esc(c.authorName || 'Anonymous') + '</span>'
            + '<span class="community-comment__time">&middot; ' + timeAgo(c.createdAt) + '</span>'
            + '</div>'
            + '<div class="community-comment__body">' + esc(c.body) + '</div>'
            + '<div class="community-comment__actions">'
            + '<button class="community-comment__action"><svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg></button>'
            + '<button class="community-comment__action"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Reply</button>'
            + '</div>';
          list.appendChild(el);
        });
      });
  }

  window.submitComment = function () {
    if (!currentUser || !currentPostId) return;
    var input = document.getElementById('commentInput');
    var body = input.value.trim();
    if (!body) return;
    input.value = ''; input.style.height = 'auto';
    db.collection('posts').doc(currentPostId).collection('comments').add({
      body: body, authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      db.collection('posts').doc(currentPostId).update({
        commentCount: firebase.firestore.FieldValue.increment(1)
      });
    });
  };

  /* ── Init ── */
  loadPosts(true);
})();
