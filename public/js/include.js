async function loadPartial(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
  }
}

loadPartial('site-header', '/partials/header.html');
loadPartial('site-footer', '/partials/footer.html');