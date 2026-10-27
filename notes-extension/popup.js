const $ = (id) => document.getElementById(id);
let notes = [];
let editingId = null;
let tab = null;

async function load() {
  ({ notes = [] } = await chrome.storage.local.get('notes'));
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  render();
}

const persist = () => chrome.storage.local.set({ notes });

function render() {
  const q = $('search').value.toLowerCase();
  const list = $('list');
  list.textContent = '';
  const shown = notes.filter((n) =>
    (n.text + ' ' + n.title + ' ' + n.url).toLowerCase().includes(q));
  if (!shown.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = q ? 'No matching notes' : 'No notes yet';
    list.append(li);
    return;
  }
  for (const n of shown) {
    const li = document.createElement('li');
    const p = document.createElement('p');
    p.textContent = n.text;
    const meta = document.createElement('small');
    const left = document.createElement('span');
    if (n.url) {
      const a = document.createElement('a');
      a.href = n.url;
      a.target = '_blank';
      a.textContent = n.title || n.url;
      left.append(a);
    } else {
      left.textContent = new Date(n.updated).toLocaleDateString();
    }
    const actions = document.createElement('span');
    for (const [label, fn] of [['Edit', () => edit(n)], ['Delete', () => remove(n)]]) {
      const b = document.createElement('button');
      b.className = 'link';
      b.textContent = label;
      b.onclick = fn;
      actions.append(b);
    }
    meta.append(left, actions);
    li.append(p, meta);
    list.append(li);
  }
}

function edit(n) {
  editingId = n.id;
  $('text').value = n.text;
  $('attach').checked = !!n.url;
  $('save').textContent = 'Update';
  $('text').focus();
}

async function remove(n) {
  notes = notes.filter((x) => x.id !== n.id);
  await persist();
  render();
}

async function save() {
  const text = $('text').value.trim();
  if (!text) return;
  const attach = $('attach').checked && tab;
  const url = attach ? tab.url : '';
  const title = attach ? tab.title : '';
  if (editingId) {
    const n = notes.find((x) => x.id === editingId);
    Object.assign(n, { text, url, title, updated: Date.now() });
  } else {
    notes.unshift({ id: crypto.randomUUID(), text, url, title, updated: Date.now() });
  }
  editingId = null;
  $('text').value = '';
  $('save').textContent = 'Save';
  await persist();
  render();
}

$('save').onclick = save;
$('search').oninput = render;
$('text').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
});
chrome.storage.onChanged.addListener(load);
load();
