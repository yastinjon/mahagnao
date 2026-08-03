// Highlights the active nav link based on the current page filename.
document.addEventListener('DOMContentLoaded', function () {
  var page = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page') === page) {
      a.classList.add('active');
    }
  });
});
