function apiRequest(url, options){
  options = options || {};
  options.headers = Object.assign({'Content-Type':'application/json'}, options.headers || {});
  options.credentials = 'same-origin';
  return fetch(url, options).then(function(res){
    return res.json().then(function(data){
      if (!res.ok) throw new Error(data.error || '请求失败');
      return data;
    });
  });
}

function escapeHtml(str){
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

var currentMember = null;

function refreshSession(){
  return apiRequest('/api/member/me').then(function(data){
    currentMember = data.member;
    document.querySelectorAll('[data-member-only]').forEach(function(el){ el.style.display = ''; });
    document.querySelectorAll('[data-guest-only]').forEach(function(el){ el.style.display = 'none'; });
    document.dispatchEvent(new CustomEvent('session-ready', { detail: { member: data.member } }));
    return true;
  }).catch(function(){
    currentMember = null;
    document.querySelectorAll('[data-member-only]').forEach(function(el){ el.style.display = 'none'; });
    document.querySelectorAll('[data-guest-only]').forEach(function(el){ el.style.display = ''; });
    document.dispatchEvent(new CustomEvent('session-ready', { detail: { member: null } }));
    return false;
  });
}

document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.policy-link').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var modal = document.getElementById('modal-' + this.getAttribute('data-policy'));
      if (modal) modal.classList.add('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function(overlay){
    overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.classList.remove('open'); });
  });
  document.querySelectorAll('[data-close]').forEach(function(btn){
    btn.addEventListener('click', function(){ btn.closest('.modal-overlay').classList.remove('open'); });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(function(m){ m.classList.remove('open'); });
  });

  var logoutLink = document.getElementById('logoutLink');
  if (logoutLink){
    logoutLink.addEventListener('click', function(){
      apiRequest('/api/auth/logout', { method: 'POST' }).then(function(){
        window.location.href = 'index.html';
      });
    });
  }

  refreshSession();
});
