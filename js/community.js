/* js/community.js — Reddit-style community forum logic
   Depends on: firebase-config.js (db, auth globals) */

(function () {
  var TOPICS = [
    { id: '369-cleanse', name: '3:6:9 Cleanse Journey', emoji: '\uD83E\uDDC3' },
    { id: 'symptoms', name: 'Symptom Discussions', emoji: '\uD83E\uDE7A' },
    { id: 'success', name: 'Success Stories', emoji: '\u2B50' },
    { id: 'recipes', name: 'Recipes & Tips', emoji: '\uD83E\uDD57' },
    { id: 'general', name: 'General Questions', emoji: '\uD83D\uDCAC' }
  ];

  var currentTopic = null;
  var currentSort = 'new';
  var currentUser = null;
  var userVotes = {};
  var lastDoc = null;
  var loading = false;
  var currentPostId = null;

  /* ── Time ago helper ── */
  function timeAgo(ts) {
    if (!ts) return '';
    var now = Date.now();
    var date = ts.toDate ? ts.toDate() : new Date(ts);
    var diff = Math.floor((now - date.getTime()) / 1000);
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

  /* ── Toast ── */
  function showToast(msg) {
    var el = document.getElementById('communityToast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  /* ── Auth ── */
  auth.onAuthStateChanged(function (user) {
    currentUser = user;
    var loginEl = document.getElementById('authLogin');
    var userEl = document.getElementById('authUser');
    var fab = document.getElementById('communityFab');

    if (user) {
      loginEl.style.display = 'none';
      userEl.style.display = 'flex';
      document.getElementById('authAvatar').src = user.photoURL || '';
      document.getElementById('authName').textContent = user.displayName || 'User';
      fab.classList.remove('hidden');
      loadUserVotes();
    } else {
      loginEl.style.display = 'flex';
      userEl.style.display = 'none';
      fab.classList.add('hidden');
      userVotes = {};
    }
    // Re-render vote buttons
    document.querySelectorAll('.community-vote__btn').forEach(function (btn) {
      var pid = btn.dataset.postId;
      btn.classList.toggle('voted', !!userVotes[pid]);
    });
  });

  window.communitySignIn = function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function (result) {
      var u = result.user;
      db.collection('users').doc(u.uid).set({
        displayName: u.displayName,
        photoURL: u.photoURL,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }).catch(function (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast('Sign-in failed. Try again.');
      }
    });
  };

  window.communitySignOut = function () {
    auth.signOut();
  };

  function loadUserVotes() {
    if (!currentUser) return;
    // We'll check votes per-post as needed, not bulk load
  }

  /* ── Seed topics if they don't exist ── */
  function seedTopics() {
    TOPICS.forEach(function (t) {
      db.collection('topics').doc(t.id).set({
        name: t.name,
        emoji: t.emoji,
        postCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  }
  seedTopics();

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

  /* ── Load posts ── */
  function loadPosts(reset) {
    if (loading) return;
    loading = true;
    var feed = document.getElementById('communityFeed');

    if (reset) {
      feed.innerHTML = '<div class="community-skeleton"><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div></div>'.repeat(3);
      lastDoc = null;
    }

    var query = db.collection('posts');

    if (currentTopic) {
      query = query.where('topicId', '==', currentTopic);
    }

    if (currentSort === 'top') {
      query = query.orderBy('voteCount', 'desc');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    query = query.limit(15);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    query.get().then(function (snap) {
      if (reset) feed.innerHTML = '';

      if (snap.empty && reset) {
        feed.innerHTML = '<div class="community-empty">'
          + '<div class="community-empty__icon">\uD83C\uDF31</div>'
          + '<div class="community-empty__title">No posts yet</div>'
          + '<div class="community-empty__desc">Be the first to share your healing journey</div></div>';
        loading = false;
        return;
      }

      snap.forEach(function (doc) {
        var p = doc.data();
        p.id = doc.id;
        feed.appendChild(renderPostCard(p));
        lastDoc = doc;
      });

      // Check votes for visible posts
      if (currentUser) {
        snap.forEach(function (doc) {
          checkVote(doc.id);
        });
      }

      loading = false;

      // Hide load-more if fewer than 15 results
      var loadMore = document.getElementById('loadMore');
      if (loadMore) loadMore.style.display = snap.size < 15 ? 'none' : 'block';
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
      if (e.target.closest('.community-vote__btn')) return;
      openPost(p.id);
    };

    var topicObj = TOPICS.find(function (t) { return t.id === p.topicId; });
    var topicLabel = topicObj ? topicObj.emoji + ' ' + topicObj.name : p.topicName || '';

    el.innerHTML = '<div class="community-vote">'
      + '<button class="community-vote__btn' + (userVotes[p.id] ? ' voted' : '') + '" data-post-id="' + p.id + '" onclick="event.stopPropagation();toggleVote(\'' + p.id + '\',this)">'
      + '<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg></button>'
      + '<span class="community-vote__count" id="vc-' + p.id + '">' + (p.voteCount || 0) + '</span>'
      + '</div>'
      + '<div class="community-post__content">'
      + '<div class="community-post__topic">' + esc(topicLabel) + '</div>'
      + '<div class="community-post__title">' + esc(p.title) + '</div>'
      + (p.body ? '<div class="community-post__preview">' + esc(p.body) + '</div>' : '')
      + '<div class="community-post__meta">'
      + '<span class="community-post__meta-item">' + esc(p.authorName || 'Anonymous') + '</span>'
      + '<span class="community-post__meta-item">' + timeAgo(p.createdAt) + '</span>'
      + '<span class="community-post__meta-item"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' + (p.commentCount || 0) + '</span>'
      + '</div></div>';

    return el;
  }

  /* ── Vote ── */
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
    if (!currentUser) {
      showToast('Sign in to upvote');
      communitySignIn();
      return;
    }

    var voteRef = db.collection('posts').doc(postId).collection('votes').doc(currentUser.uid);
    var postRef = db.collection('posts').doc(postId);

    if (userVotes[postId]) {
      // Remove vote
      voteRef.delete();
      postRef.update({ voteCount: firebase.firestore.FieldValue.increment(-1) });
      userVotes[postId] = false;
      btn.classList.remove('voted');
      var countEl = document.getElementById('vc-' + postId);
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
    } else {
      // Add vote
      voteRef.set({ userId: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      postRef.update({ voteCount: firebase.firestore.FieldValue.increment(1) });
      userVotes[postId] = true;
      btn.classList.add('voted');
      var countEl2 = document.getElementById('vc-' + postId);
      if (countEl2) countEl2.textContent = parseInt(countEl2.textContent) + 1;
    }
  };

  /* ── New post ── */
  window.openNewPost = function () {
    if (!currentUser) {
      showToast('Sign in to post');
      communitySignIn();
      return;
    }
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

    if (!title || !topicId) {
      showToast('Title and topic are required');
      return;
    }

    var submitBtn = document.getElementById('postSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    var topicObj = TOPICS.find(function (t) { return t.id === topicId; });

    db.collection('posts').add({
      title: title,
      body: body,
      topicId: topicId,
      topicName: topicObj ? topicObj.name : '',
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      authorPhoto: currentUser.photoURL || '',
      voteCount: 0,
      commentCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      // Increment topic post count
      db.collection('topics').doc(topicId).update({
        postCount: firebase.firestore.FieldValue.increment(1)
      }).catch(function () {});

      document.getElementById('postTitle').value = '';
      document.getElementById('postBody').value = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share with community';
      closeNewPost();
      showToast('Post shared');
      loadPosts(true);
    }).catch(function (err) {
      showToast('Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share with community';
    });
  };

  /* ── Post detail ── */
  function openPost(postId) {
    currentPostId = postId;
    var feed = document.getElementById('communityFeedWrap');
    var detail = document.getElementById('communityDetail');
    feed.classList.add('hidden');
    detail.classList.add('show');
    detail.innerHTML = '<div class="community-skeleton"><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div><div class="community-skeleton__row"></div></div>';
    window.scrollTo(0, 0);

    db.collection('posts').doc(postId).get().then(function (doc) {
      if (!doc.exists) {
        detail.innerHTML = '<p>Post not found.</p>';
        return;
      }
      var p = doc.data();
      var topicObj = TOPICS.find(function (t) { return t.id === p.topicId; });
      var topicLabel = topicObj ? topicObj.emoji + ' ' + topicObj.name : '';

      var h = '<button class="community-detail__back" onclick="closePost()">'
        + '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Back</button>'
        + '<div class="community-detail__topic">' + esc(topicLabel) + '</div>'
        + '<div class="community-detail__title">' + esc(p.title) + '</div>'
        + '<div class="community-detail__meta">' + esc(p.authorName || 'Anonymous') + ' &middot; ' + timeAgo(p.createdAt) + '</div>'
        + '<div class="community-detail__votes">'
        + '<button class="community-vote__btn' + (userVotes[postId] ? ' voted' : '') + '" data-post-id="' + postId + '" onclick="toggleVote(\'' + postId + '\',this)">'
        + '<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg></button>'
        + '<span class="community-vote__count" id="vc-' + postId + '">' + (p.voteCount || 0) + '</span>'
        + '<span style="color:var(--text-muted);font-size:12px">upvotes</span>'
        + '</div>'
        + '<div class="community-detail__body">' + esc(p.body || '') + '</div>'
        + '<div class="community-comments__header" id="commentHeader">Comments</div>'
        + '<div id="commentsList"></div>';

      if (currentUser) {
        h += '<div class="community-comment-input">'
          + '<textarea class="community-comment-input__field" id="commentInput" placeholder="Write a comment..." rows="1"'
          + ' oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'"></textarea>'
          + '<button class="community-comment-input__send" onclick="submitComment()">'
          + '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>';
      }

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
      .orderBy('createdAt', 'asc')
      .onSnapshot(function (snap) {
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
          var el = document.createElement('div');
          el.className = 'community-comment';
          el.innerHTML = '<div><span class="community-comment__author">' + esc(c.authorName || 'Anonymous') + '</span>'
            + '<span class="community-comment__time">' + timeAgo(c.createdAt) + '</span></div>'
            + '<div class="community-comment__body">' + esc(c.body) + '</div>';
          list.appendChild(el);
        });
      });
  }

  window.submitComment = function () {
    if (!currentUser || !currentPostId) return;
    var input = document.getElementById('commentInput');
    var body = input.value.trim();
    if (!body) return;

    input.value = '';
    input.style.height = 'auto';

    db.collection('posts').doc(currentPostId).collection('comments').add({
      body: body,
      authorId: currentUser.uid,
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
